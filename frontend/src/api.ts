import {
  LivePulseData,
  BinomialData,
  LossFingerprintData,
  ModelValidationData,
  PublicMeasurementItem
} from './types';

const API_BASE = '/api/v1';

export async function fetchLivePulse(
  source: 'RIPE_ATLAS' | 'LOCAL_DIAGNOSTIC' | 'HISTORICAL',
  msmId: number = 1001,
  target: string = '1.1.1.1',
  forceRefresh: boolean = false
): Promise<LivePulseData> {
  const url = `${API_BASE}/pulse?source=${source}&msm_id=${msmId}&target=${encodeURIComponent(target)}&force_refresh=${forceRefresh}&_t=${Date.now()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch pulse (HTTP ${resp.status})`);
  }
  return resp.json();
}

export async function calculateBinomial(payload: {
  n: number;
  p: number;
  x: number;
  threshold: number;
  mode: 'measured' | 'manual';
}): Promise<BinomialData> {
  const resp = await fetch(`${API_BASE}/probability/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Binomial calculation failed (HTTP ${resp.status})`);
  }
  return resp.json();
}

export async function fetchLossFingerprint(
  source: 'RIPE_ATLAS' | 'LOCAL_DIAGNOSTIC',
  msmId: number = 1001,
  target: string = '1.1.1.1',
  forceRefresh: boolean = false
): Promise<LossFingerprintData> {
  const url = `${API_BASE}/fingerprint?source=${source}&msm_id=${msmId}&target=${encodeURIComponent(target)}&force_refresh=${forceRefresh}&_t=${Date.now()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to fetch loss fingerprint (HTTP ${resp.status})`);
  }
  return resp.json();
}

export async function fetchModelValidation(
  source: 'RIPE_ATLAS' | 'LOCAL_DIAGNOSTIC',
  msmId: number = 1001,
  target: string = '1.1.1.1',
  forceRefresh: boolean = false
): Promise<ModelValidationData> {
  const url = `${API_BASE}/validation?source=${source}&msm_id=${msmId}&target=${encodeURIComponent(target)}&force_refresh=${forceRefresh}&_t=${Date.now()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to validate model (HTTP ${resp.status})`);
  }
  return resp.json();
}

export async function fetchPublicMeasurements(
  target?: string,
  pageSize: number = 10
): Promise<PublicMeasurementItem[]> {
  let url = `${API_BASE}/measurements/public?page_size=${pageSize}`;
  if (target) url += `&target=${encodeURIComponent(target)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to list measurements (HTTP ${resp.status})`);
  }
  return resp.json();
}

export async function fetchHistoricalRecords(limit: number = 20): Promise<any[]> {
  const resp = await fetch(`${API_BASE}/measurements/history?limit=${limit}`);
  if (!resp.ok) {
    throw new Error(`Failed to list history (HTTP ${resp.status})`);
  }
  return resp.json();
}

export async function executeLocalDiagnostic(target: string, count: number = 10): Promise<any> {
  const resp = await fetch(`${API_BASE}/measurements/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, count }),
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || `Local diagnostics failed (HTTP ${resp.status})`);
  }
  return resp.json();
}

export async function fetchProvenanceData(): Promise<any> {
  const resp = await fetch(`${API_BASE}/provenance`);
  if (!resp.ok) {
    throw new Error(`Failed to retrieve provenance (HTTP ${resp.status})`);
  }
  return resp.json();
}
