import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  TrendingDown,
  Info,
  Scale,
  Percent
} from 'lucide-react';
import { fetchModelValidation } from '../api';
import { ModelValidationData } from '../types';

interface ValidationPageProps {
  source: 'RIPE_ATLAS' | 'LOCAL_DIAGNOSTIC';
  msmId: number;
  target: string;
  lastFetchedEpoch?: number;
}

export const ValidationPage: React.FC<ValidationPageProps> = ({
  source,
  msmId,
  target,
  lastFetchedEpoch,
}) => {
  const [data, setData] = useState<ModelValidationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadValidation();
  }, [source, msmId, target, lastFetchedEpoch]);

  async function loadValidation() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchModelValidation(source, msmId, target, true);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to validate model.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-slate-400 font-mono text-sm">Evaluating statistical model assumptions & goodness of fit...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center my-8">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Validation Telemetry Unavailable</h3>
        <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">{error || 'No validation data available.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
          <span>Model Validation & Statistical Trust Check</span>
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Rigorous hypothesis testing and goodness-of-fit validation for Binomial network loss modeling.
        </p>
      </div>

      {/* Feature C: Expected vs Observed Loss Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Actual Observed Losses */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Observed Losses</span>
            <AlertTriangle className={`w-4 h-4 ${data.observed_losses > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {data.observed_losses} pkts
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Across n = {data.batch_n} attempts
          </div>
        </div>

        {/* Model-Expected Losses */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Model-Expected E[X]</span>
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {data.expected_losses} pkts
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            E[X] = n · p̂ = {data.batch_n} × {data.estimated_p.toFixed(4)}
          </div>
        </div>

        {/* Discrepancy / Delta */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Residual Difference</span>
            <span className="text-xs font-mono text-slate-400">Obs - Exp</span>
          </div>
          <div className="text-2xl font-bold font-mono text-violet-300">
            {data.difference > 0 ? `+${data.difference}` : data.difference}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Residual deviation
          </div>
        </div>

        {/* Tail Probability */}
        <div className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">P(X ≥ Observed)</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {(data.tail_prob_of_observed_or_worse * 100).toFixed(2)}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">
            Probability under H0
          </div>
        </div>

      </div>

      {/* Feature E: Wilson Score Confidence Interval Box */}
      <div className="glass-panel-accent rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Scale className="w-4 h-4 text-violet-400" />
            <span>Wilson Score 95% Confidence Interval for Loss Proportion</span>
          </h2>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-violet-950/60 text-violet-300 border border-violet-700/40">
            α = 0.05 (z ≈ 1.96)
          </span>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
          {data.wilson_ci.interpretation}
        </p>

        {/* Graphical Range Bar */}
        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Lower Bound: {(data.wilson_ci.ci_lower * 100).toFixed(3)}%</span>
            <span className="text-cyan-300 font-bold">p̂ Point Estimate: {(data.wilson_ci.p_hat * 100).toFixed(3)}%</span>
            <span>Upper Bound: {(data.wilson_ci.ci_upper * 100).toFixed(3)}%</span>
          </div>

          <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700 flex items-center relative">
            <div
              className="bg-gradient-to-r from-violet-500 to-cyan-400 h-full rounded-full opacity-80"
              style={{
                marginLeft: `${Math.max(0, data.wilson_ci.ci_lower * 100)}%`,
                width: `${Math.max(1, (data.wilson_ci.ci_upper - data.wilson_ci.ci_lower) * 100)}%`
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0.0%</span>
            <span>25.0%</span>
            <span>50.0%</span>
            <span>100.0%</span>
          </div>
        </div>
      </div>

      {/* Wald-Wolfowitz Runs Test for Independence */}
      {data.runs_test && (
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                <span>Wald-Wolfowitz Runs Test for Temporal Independence</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                Null Hypothesis H0: Consecutive packet losses are independent Bernoulli trials.
              </span>
            </div>

            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border font-mono self-start ${
              data.runs_test.is_conclusive
                ? data.runs_test.p_value >= 0.05
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {data.runs_test.is_conclusive ? (data.runs_test.p_value >= 0.05 ? 'Passes Independence' : 'Reject Independence') : 'Inconclusive'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs pt-1">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Observed Runs (R)</span>
              <span className="text-base font-bold text-white">{data.runs_test.observed_runs}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Expected Runs E[R]</span>
              <span className="text-base font-bold text-cyan-300">{data.runs_test.expected_runs}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Z Statistic</span>
              <span className="text-base font-bold text-violet-300">{data.runs_test.z_statistic}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Two-Tailed p-value</span>
              <span className="text-base font-bold text-white">{data.runs_test.p_value.toFixed(4)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
            <strong className="text-slate-200">Test Outcome: </strong>{data.runs_test.verdict}
          </p>

          <div className="text-[11px] text-slate-400 font-sans border-t border-slate-800/80 pt-2">
            <strong className="text-slate-400">Statistical Caveat: </strong>
            {data.runs_test.limitations}
          </div>
        </div>
      )}

      {/* Chi-Square Goodness of Fit Test */}
      {data.chi_square_gof && (
        <div className="glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Scale className="w-4 h-4 text-violet-400" />
              <span>Chi-Square Goodness-of-Fit Test across Batches</span>
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
              {data.chi_square_gof.is_applicable ? `df = ${data.chi_square_gof.degrees_of_freedom}` : 'Not Applicable'}
            </span>
          </div>

          {data.chi_square_gof.is_applicable ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Chi-Square Statistic (χ²)</span>
                  <span className="text-base font-bold text-cyan-300">{data.chi_square_gof.chi2_statistic}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Degrees of Freedom</span>
                  <span className="text-base font-bold text-white">{data.chi_square_gof.degrees_of_freedom}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">p-value</span>
                  <span className="text-base font-bold text-violet-300">{data.chi_square_gof.p_value?.toFixed(4)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 font-mono mt-2">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2 px-3">Bin Category</th>
                      <th className="py-2 px-3 text-right">Observed Freq (O)</th>
                      <th className="py-2 px-3 text-right">Expected Freq (E)</th>
                      <th className="py-2 px-3 text-right">(O - E)² / E</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {data.chi_square_gof.bins.map((b, idx) => {
                      const chiTerm = b.expected > 0 ? Math.pow(b.observed - b.expected, 2) / b.expected : 0;
                      return (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-semibold text-white">{b.label}</td>
                          <td className="py-2 px-3 text-right text-cyan-300">{b.observed}</td>
                          <td className="py-2 px-3 text-right text-slate-400">{b.expected}</td>
                          <td className="py-2 px-3 text-right text-violet-300">{chiTerm.toFixed(3)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-300 font-sans pt-1">
                {data.chi_square_gof.verdict}
              </p>
            </>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-sans">
              <strong className="text-slate-300">Condition Not Met: </strong>
              {data.chi_square_gof.reason_if_not_applicable}
            </div>
          )}
        </div>
      )}

      {/* Binomial Assumption Checklist */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Info className="w-4 h-4 text-cyan-400" />
          <span>Binomial Model Assumption Checklist</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.binomial_assumptions_check.map((item, idx) => {
            const isSatisfied = item.status === 'SATISFIED' || item.status === 'REASONABLE';
            const isInconclusive = item.status === 'INCONCLUSIVE' || item.status === 'PARTIALLY_VALID';
            return (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{item.assumption}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    isSatisfied
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                      : isInconclusive
                      ? 'bg-amber-950/60 text-amber-300 border border-amber-800'
                      : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
