from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ProbeSummary(BaseModel):
    probe_id: str
    target: str
    sent: int
    rcvd: int
    lost: int
    loss_rate: float
    avg_rtt: Optional[float] = None
    min_rtt: Optional[float] = None
    max_rtt: Optional[float] = None
    timestamp_epoch: int
    firmware: Optional[int] = None
    dst_addr: Optional[str] = None
    src_addr: Optional[str] = None

class LivePulseMetrics(BaseModel):
    source: str # "RIPE_ATLAS" | "LOCAL_DIAGNOSTIC" | "HISTORICAL"
    target: str
    measurement_id: Optional[str] = None
    freshness_status: str # "LIVE" | "RECENT" | "HISTORICAL" | "STALE" | "UNAVAILABLE"
    last_fetched_epoch: int
    measurement_timestamp_epoch: int
    
    total_probes_or_attempts: int
    total_sent: int
    successful_replies: int
    failed_losses: int
    observed_loss_percentage: float
    estimated_p: float
    
    avg_rtt_ms: Optional[float] = None
    median_rtt_ms: Optional[float] = None
    p95_rtt_ms: Optional[float] = None
    
    metric_descriptions: Dict[str, str] = {}
    sample_window_description: str
    data_integrity: str # "VERIFIED_REAL_MEASUREMENT" | "HISTORICAL_RETAINED" | "MANUAL_SCENARIO"
    probes: List[ProbeSummary] = []

class BinomialCalculationRequest(BaseModel):
    n: int = Field(ge=1, le=10000, description="Number of packet or probe attempts in batch")
    p: float = Field(ge=0.0, le=1.0, description="Loss probability per trial")
    x: int = Field(ge=0, description="Specific loss count to evaluate")
    threshold: int = Field(default=5, ge=0, description="Threshold loss count")
    mode: str = Field(default="measured", description="'measured' or 'manual'")

class PMFPoint(BaseModel):
    k: int
    probability: float
    cumulative_prob: float
    upper_tail_prob: float

class BinomialCalculationResponse(BaseModel):
    n: int
    p: float
    x: int
    threshold: int
    mode: str
    
    prob_exact_x: float
    prob_at_most_x: float
    prob_at_least_x: float
    prob_zero_losses: float
    prob_exceeding_threshold: float
    
    expected_losses: float
    variance: float
    std_dev: float
    
    formula_latex: str
    substituted_formula: str
    plain_english_explanation: str
    
    pmf_distribution: List[PMFPoint]

class LossFingerprintResponse(BaseModel):
    source: str
    measurement_id: Optional[str]
    target: str
    total_trials: int
    total_losses: int
    loss_rate: float
    
    sequential_attempts: List[int] # 0 = reply, 1 = drop
    rtt_series: List[Optional[float]]
    
    max_consecutive_losses: int
    consecutive_run_counts: Dict[str, int] # e.g. {"1": 4, "2": 1, "3+": 0}
    burstiness_dispersion_index: float # Var/Mean ratio across temporal windows
    
    temporal_classification: str # "Low observed loss" | "Uniform / Dispersed loss" | "Potentially clustered loss" | "Insufficient evidence"
    classification_reason: str
    data_sufficiency: bool
    limitations: str

class ConfidenceIntervalInfo(BaseModel):
    method: str = "Wilson Score Interval"
    confidence_level: float = 0.95
    p_hat: float
    ci_lower: float
    ci_upper: float
    sample_size: int
    interpretation: str

class RunsTestResult(BaseModel):
    test_name: str = "Wald-Wolfowitz Runs Test for Independence"
    total_n: int
    n_success: int
    n_loss: int
    observed_runs: int
    expected_runs: float
    runs_variance: float
    z_statistic: float
    p_value: float
    null_hypothesis: str
    alternative_hypothesis: str
    is_conclusive: bool
    verdict: str
    limitations: str

class ChiSquareGoFResult(BaseModel):
    test_name: str = "Chi-Square Goodness-of-Fit Test for Binomial Distribution"
    is_applicable: bool
    reason_if_not_applicable: Optional[str] = None
    degrees_of_freedom: Optional[int] = None
    chi2_statistic: Optional[float] = None
    p_value: Optional[float] = None
    bins: List[Dict[str, Any]] = []
    verdict: Optional[str] = None
    limitations: str

class ModelValidationResponse(BaseModel):
    source: str
    measurement_id: Optional[str]
    batch_n: int
    estimated_p: float
    observed_losses: int
    expected_losses: float
    difference: float
    
    tail_prob_of_observed_or_worse: float
    wilson_ci: ConfidenceIntervalInfo
    runs_test: Optional[RunsTestResult] = None
    chi_square_gof: Optional[ChiSquareGoFResult] = None
    
    binomial_assumptions_check: List[Dict[str, Any]]
    explainable_insights: List[str]

class LocalPingRequest(BaseModel):
    target: str = Field(default="1.1.1.1", description="Hostname or IP to ping")
    count: int = Field(default=10, ge=3, le=30, description="Number of packets")

class PublicMeasurementItem(BaseModel):
    id: int
    target: str
    type: str
    description: Optional[str] = None
    participant_count: Optional[int] = None
    status: Optional[str] = None
