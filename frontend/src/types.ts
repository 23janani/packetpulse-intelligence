export interface ProbeSummary {
  probe_id: string;
  target: string;
  sent: number;
  rcvd: number;
  lost: number;
  loss_rate: number;
  avg_rtt?: number | null;
  min_rtt?: number | null;
  max_rtt?: number | null;
  timestamp_epoch: number;
  firmware?: number | null;
  dst_addr?: string | null;
  src_addr?: string | null;
}

export interface NetworkAlert {
  level: 'HEALTHY' | 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  message: string;
}

export interface LivePulseData {
  source: 'RIPE_ATLAS' | 'LOCAL_DIAGNOSTIC' | 'HISTORICAL';
  target: string;
  measurement_id?: string;
  freshness_status: 'LIVE' | 'RECENT' | 'HISTORICAL' | 'STALE' | 'UNAVAILABLE';
  last_fetched_epoch: number;
  measurement_timestamp_epoch: number;
  age_seconds: number;
  
  total_probes_or_attempts: number;
  total_sent: number;
  successful_replies: number;
  failed_losses: number;
  observed_loss_percentage: number;
  estimated_p: number;
  
  avg_rtt_ms?: number | null;
  median_rtt_ms?: number | null;
  p95_rtt_ms?: number | null;
  
  sample_window_description: string;
  data_integrity: 'VERIFIED_REAL_MEASUREMENT' | 'HISTORICAL_RETAINED' | 'MANUAL_SCENARIO';
  metric_descriptions: Record<string, string>;
  alerts: NetworkAlert[];
  probes: ProbeSummary[];
  sequential_attempts: number[];
  rtt_series: number[];
}

export interface PMFPoint {
  k: number;
  probability: number;
  cumulative_prob: number;
  upper_tail_prob: number;
}

export interface BinomialData {
  n: number;
  p: number;
  x: number;
  threshold: number;
  mode: 'measured' | 'manual';
  
  prob_exact_x: number;
  prob_at_most_x: number;
  prob_at_least_x: number;
  prob_zero_losses: number;
  prob_exceeding_threshold: number;
  
  expected_losses: number;
  variance: number;
  std_dev: number;
  
  formula_latex: string;
  substituted_formula: string;
  plain_english_explanation: string;
  pmf_distribution: PMFPoint[];
}

export interface LossFingerprintData {
  source: string;
  measurement_id?: string;
  target: string;
  total_trials: number;
  total_losses: number;
  loss_rate: number;
  
  sequential_attempts: number[];
  rtt_series: (number | null)[];
  
  max_consecutive_losses: number;
  consecutive_run_counts: Record<string, number>;
  burstiness_dispersion_index: number;
  
  temporal_classification: string;
  classification_reason: string;
  data_sufficiency: boolean;
  limitations: string;
}

export interface ConfidenceIntervalInfo {
  method: string;
  confidence_level: number;
  p_hat: number;
  ci_lower: number;
  ci_upper: number;
  sample_size: number;
  interpretation: string;
}

export interface RunsTestResult {
  test_name: string;
  total_n: number;
  n_success: number;
  n_loss: number;
  observed_runs: number;
  expected_runs: number;
  runs_variance: number;
  z_statistic: number;
  p_value: number;
  null_hypothesis: string;
  alternative_hypothesis: string;
  is_conclusive: boolean;
  verdict: string;
  limitations: string;
}

export interface ChiSquareGoFResult {
  test_name: string;
  is_applicable: boolean;
  reason_if_not_applicable?: string | null;
  degrees_of_freedom?: number | null;
  chi2_statistic?: number | null;
  p_value?: number | null;
  bins: Array<{ label: string; observed: number; expected: number }>;
  verdict?: string | null;
  limitations: string;
}

export interface ModelValidationData {
  source: string;
  measurement_id?: string;
  batch_n: number;
  estimated_p: number;
  observed_losses: number;
  expected_losses: number;
  difference: number;
  tail_prob_of_observed_or_worse: number;
  wilson_ci: ConfidenceIntervalInfo;
  runs_test?: RunsTestResult | null;
  chi_square_gof?: ChiSquareGoFResult | null;
  binomial_assumptions_check: Array<{
    assumption: string;
    status: string;
    detail: string;
  }>;
  explainable_insights: string[];
}

export interface PublicMeasurementItem {
  id: number;
  target: string;
  type: string;
  description?: string | null;
  participant_count?: number | null;
  status?: string | null;
}

