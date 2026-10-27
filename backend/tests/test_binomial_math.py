import pytest
import math
from backend.app.services.binomial_engine import calculate_binomial_metrics, calculate_wilson_score_interval

def test_binomial_standard_calculation():
    # n=10, p=0.1, x=1
    res = calculate_binomial_metrics(n=10, p=0.1, x=1, threshold=3)
    
    # Expected: E[X] = 10 * 0.1 = 1.0
    assert abs(res.expected_losses - 1.0) < 1e-4
    # Var: 10 * 0.1 * 0.9 = 0.9
    assert abs(res.variance - 0.9) < 1e-4
    # SD: sqrt(0.9) approx 0.9487
    assert abs(res.std_dev - math.sqrt(0.9)) < 1e-4
    
    # P(X = 1) = 10 * 0.1^1 * 0.9^9 = 10 * 0.1 * 0.38742 = 0.38742
    assert abs(res.prob_exact_x - 0.38742) < 1e-3

def test_pmf_sums_to_one():
    # For any valid n and p, sum of PMF from 0 to n should equal 1.0
    for n in [5, 10, 20]:
        for p in [0.05, 0.2, 0.5]:
            res = calculate_binomial_metrics(n=n, p=p, x=0, threshold=n)
            total_prob = sum(pt.probability for pt in res.pmf_distribution)
            assert abs(total_prob - 1.0) < 1e-3

def test_binomial_edge_cases():
    # p = 0.0 (Zero loss certainty)
    res_zero = calculate_binomial_metrics(n=50, p=0.0, x=0)
    assert res_zero.prob_exact_x == 1.0
    assert res_zero.prob_zero_losses == 1.0
    assert res_zero.expected_losses == 0.0
    
    # p = 1.0 (100% loss certainty)
    res_one = calculate_binomial_metrics(n=20, p=1.0, x=20)
    assert res_one.prob_exact_x == 1.0
    assert res_one.prob_zero_losses == 0.0
    assert res_one.expected_losses == 20.0

    # n = 0
    res_n0 = calculate_binomial_metrics(n=0, p=0.1, x=0)
    assert res_n0.expected_losses == 0.0
    assert res_n0.prob_zero_losses == 1.0

    # x > n
    res_x_gt_n = calculate_binomial_metrics(n=5, p=0.1, x=10)
    assert res_x_gt_n.prob_exact_x == 0.0
    assert res_x_gt_n.prob_at_most_x == 1.0

def test_wilson_score_interval():
    # 2 losses out of 100 attempts: p_hat = 0.02
    ci = calculate_wilson_score_interval(successes=2, total=100, confidence=0.95)
    assert ci.p_hat == 0.02
    assert 0.0 <= ci.ci_lower <= ci.p_hat <= ci.ci_upper <= 1.0
    # Lower bound must be strictly > 0 for 2 successes in 100 trials
    assert ci.ci_lower > 0.0
    assert ci.ci_upper < 0.10

    # 0 losses out of 50 attempts
    ci_zero = calculate_wilson_score_interval(successes=0, total=50, confidence=0.95)
    assert ci_zero.ci_lower == 0.0
    assert ci_zero.ci_upper > 0.0
