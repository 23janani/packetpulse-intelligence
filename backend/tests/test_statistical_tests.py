import pytest
from backend.app.services.statistical_validation import (
    perform_runs_test,
    perform_chi_square_gof,
    analyze_loss_fingerprint
)

def test_runs_test_clustered():
    # Sequence with heavy clustering: 10 successes followed by 10 losses (only 2 runs!)
    seq_clustered = [0]*10 + [1]*10
    res = perform_runs_test(seq_clustered)
    assert res.observed_runs == 2
    assert res.z_statistic < -2.0 # highly negative Z indicates clustering
    assert res.p_value < 0.05
    assert "clustering" in res.verdict.lower()

def test_runs_test_alternating():
    # Sequence with alternating pattern: 0, 1, 0, 1, ...
    seq_alt = [0, 1] * 10
    res = perform_runs_test(seq_alt)
    assert res.observed_runs == 20
    assert res.z_statistic > 2.0 # highly positive Z indicates alternating
    assert res.p_value < 0.05

def test_runs_test_inconclusive_small():
    # Sequence with too few observations
    res = perform_runs_test([0, 0, 1])
    assert res.is_conclusive is False
    assert "inconclusive" in res.verdict.lower()

def test_loss_fingerprint_metrics():
    # Sequence with runs of length 1, 2, and 3
    # 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0
    seq = [0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0]
    rtts = [20.0] * len(seq)
    fp = analyze_loss_fingerprint(seq, rtts)
    
    assert fp["max_consecutive_losses"] == 3
    assert fp["consecutive_run_counts"]["1"] == 1
    assert fp["consecutive_run_counts"]["2"] == 1
    assert fp["consecutive_run_counts"]["3+"] == 1
    assert fp["data_sufficiency"] is True
    assert fp["temporal_classification"] == "Potentially clustered loss"

def test_chi_square_gof_insufficient_batches():
    # Fewer than 15 batches
    res = perform_chi_square_gof(batch_loss_counts=[0, 1, 0], batch_size_n=5, estimated_p=0.1)
    assert res.is_applicable is False
    assert "insufficient batch count" in res.reason_if_not_applicable.lower()
