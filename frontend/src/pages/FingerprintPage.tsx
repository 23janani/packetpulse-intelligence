import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Activity,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingDown,
  Info,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { fetchLossFingerprint } from '../api';
import { LossFingerprintData } from '../types';

interface FingerprintPageProps {
  source: 'RIPE_ATLAS' | 'LOCAL_DIAGNOSTIC';
  msmId: number;
  target: string;
  lastFetchedEpoch?: number;
}

export const FingerprintPage: React.FC<FingerprintPageProps> = ({
  source,
  msmId,
  target,
  lastFetchedEpoch,
}) => {
  const [data, setData] = useState<LossFingerprintData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFingerprint();
  }, [source, msmId, target, lastFetchedEpoch]);

  async function loadFingerprint() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchLossFingerprint(source, msmId, target, true);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch loss fingerprint.');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-slate-400 font-mono text-sm">Computing temporal loss fingerprint...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center my-8">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Fingerprint Telemetry Unavailable</h3>
        <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">{error || 'No sequential data available.'}</p>
      </div>
    );
  }

  const runData = [
    { label: 'Isolated (1 drop)', count: data.consecutive_run_counts['1'] || 0, color: '#06B6D4' },
    { label: 'Double (2 drops)', count: data.consecutive_run_counts['2'] || 0, color: '#8B5CF6' },
    { label: 'Bursts (3+ drops)', count: data.consecutive_run_counts['3+'] || 0, color: '#F43F5E' },
  ];

  const classStyles: Record<string, { badge: string; bg: string }> = {
    'Low observed loss': {
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      bg: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
    },
    'Uniform / Dispersed loss': {
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      bg: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-200'
    },
    'Potentially clustered loss': {
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      bg: 'border-rose-500/30 bg-rose-950/20 text-rose-200'
    },
    'Elevated observed loss': {
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      bg: 'border-amber-500/30 bg-amber-950/20 text-amber-200'
    },
    'Insufficient evidence': {
      badge: 'bg-slate-700 text-slate-300 border-slate-600',
      bg: 'border-slate-800 bg-slate-900/40 text-slate-300'
    }
  };

  const currentStyle = classStyles[data.temporal_classification] || classStyles['Insufficient evidence'];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <Fingerprint className="w-6 h-6 text-cyan-400" />
          <span>Loss Fingerprint & Burstiness Analysis</span>
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Dissects how packet failures are distributed over time: memoryless dispersion vs clustered queuing bursts.
        </p>
      </div>

      {/* Top Classification Banner */}
      <div className={`p-4 rounded-2xl border ${currentStyle.bg} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900/60 border border-slate-700/60 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Classification:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentStyle.badge}`}>
                {data.temporal_classification}
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1 leading-relaxed">
              {data.classification_reason}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-xs font-mono border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-5 flex-shrink-0">
          <div>
            <span className="text-slate-400 block text-[10px]">Dispersion Index</span>
            <span className="font-bold text-white text-base">{data.burstiness_dispersion_index}</span>
            <span className="text-[10px] text-slate-500 block">Var / Mean</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Max Drop Run</span>
            <span className="font-bold text-rose-400 text-base">{data.max_consecutive_losses} pkts</span>
            <span className="text-[10px] text-slate-500 block">Longest burst</span>
          </div>
        </div>
      </div>

      {/* Sequential Attempt Timeline */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Sequential Attempt Timeline (Binary Stream)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Each block represents an individual ping probe: Cyan = Echo Reply Received (0), Red = Drop / Timeout (1).
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-cyan-500/20 border border-cyan-400" />
              <span className="text-slate-300">Success (0)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/60 border border-rose-500" />
              <span className="text-slate-300">Loss (1)</span>
            </div>
          </div>
        </div>

        {/* Binary stream visualizer */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 overflow-x-auto">
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
            {data.sequential_attempts && data.sequential_attempts.length > 0 ? (
              data.sequential_attempts.map((isLoss, idx) => (
                <div
                  key={idx}
                  title={`Probe #${idx + 1}: ${isLoss === 1 ? 'DROPPED (1)' : 'REPLIED (0)'}`}
                  className={`w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-mono font-bold transition-transform hover:scale-125 cursor-default ${
                    isLoss === 1
                      ? 'bg-rose-500 border border-rose-400 text-white shadow-sm shadow-rose-500/40'
                      : 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-400'
                  }`}
                >
                  {isLoss}
                </div>
              ))
            ) : (
              <span className="text-slate-500 text-xs font-mono">No sequence events recorded.</span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Consecutive Loss Runs vs Independent Bernoulli Baseline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Consecutive Loss Run Counts */}
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-violet-400" />
            <span>Consecutive Failure Run Lengths</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Frequency of loss streaks: single isolated drops vs multi-packet burst drop runs.
          </p>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={runData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F1F5F9', fontSize: '12px' }}
                  formatter={(val: any) => [`${val} occurrences`, 'Count']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {runData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Independent Bernoulli Baseline Comparison */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center space-x-2">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Independent-Bernoulli Baseline Comparison</span>
          </h2>
          
          <p className="text-xs text-slate-300 leading-relaxed">
            In a memoryless Bernoulli process with loss probability <strong>p = {(data.loss_rate * 100).toFixed(2)}%</strong>:
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">P(Run of length 1):</span>
              <span className="text-cyan-300 font-bold">
                {((1 - data.loss_rate) * 100).toFixed(2)}%
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">P(Run of length ≥ 2):</span>
              <span className="text-violet-300 font-bold">
                {(Math.pow(data.loss_rate, 2) * 100).toFixed(4)}%
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">P(Run of length ≥ 3):</span>
              <span className="text-rose-400 font-bold">
                {(Math.pow(data.loss_rate, 3) * 100).toFixed(5)}%
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans">
            <strong className="text-slate-300">Caveat: </strong>
            {data.limitations}
          </div>
        </div>

      </div>

    </div>
  );
};
