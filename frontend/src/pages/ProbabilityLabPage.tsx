import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Sliders,
  Calculator,
  Percent,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine
} from 'recharts';
import { calculateBinomial } from '../api';
import { BinomialData } from '../types';

interface ProbabilityLabPageProps {
  measuredP: number;
  measuredSource: string;
}

export const ProbabilityLabPage: React.FC<ProbabilityLabPageProps> = ({
  measuredP,
  measuredSource,
}) => {
  const [mode, setMode] = useState<'measured' | 'manual'>('measured');
  const [n, setN] = useState<number>(50);
  const [manualP, setManualP] = useState<number>(0.05);
  const [x, setX] = useState<number>(2);
  const [threshold, setThreshold] = useState<number>(5);
  const [result, setResult] = useState<BinomialData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Active probability depending on mode
  const activeP = mode === 'measured' ? measuredP : manualP;

  useEffect(() => {
    runCalculation();
  }, [n, activeP, x, threshold, mode]);

  async function runCalculation() {
    setIsLoading(true);
    try {
      const data = await calculateBinomial({
        n,
        p: activeP,
        x,
        threshold,
        mode,
      });
      setResult(data);
    } catch (err) {
      console.error('Binomial calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <FlaskConical className="w-6 h-6 text-cyan-400" />
            <span>Binomial Probability Laboratory</span>
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Model discrete packet loss distributions for future transmission batches: X ~ Binomial(n, p).
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
          <button
            onClick={() => setMode('measured')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              mode === 'measured'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Measured Mode (p̂ = {(measuredP * 100).toFixed(2)}%)</span>
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
              mode === 'manual'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Manual Scenario</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Controls & Formula Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls Card */}
        <div className="glass-panel rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <span>Model Parameters</span>
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
              {mode === 'measured' ? 'Live Telemetry' : 'Hypothetical'}
            </span>
          </div>

          {/* Batch Size (n) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Batch Size (n packets):</span>
              <span className="text-white font-bold">{n} packets</span>
            </div>
            <input
              type="range"
              min="5"
              max="200"
              step="5"
              value={n}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setN(val);
                if (x > val) setX(val);
                if (threshold > val) setThreshold(val);
              }}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>5</span>
              <span>50</span>
              <span>100</span>
              <span>200</span>
            </div>
          </div>

          {/* Loss Probability (p) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Loss Probability (p):</span>
              <span className={`font-bold ${mode === 'measured' ? 'text-cyan-400' : 'text-violet-400'}`}>
                {(activeP * 100).toFixed(2)}% (p = {activeP.toFixed(4)})
              </span>
            </div>
            {mode === 'manual' ? (
              <>
                <input
                  type="range"
                  min="0.00"
                  max="0.40"
                  step="0.005"
                  value={manualP}
                  onChange={(e) => setManualP(parseFloat(e.target.value))}
                  className="w-full accent-violet-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0%</span>
                  <span>10%</span>
                  <span>20%</span>
                  <span>40%</span>
                </div>
              </>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Derived from {measuredSource}:</span>
                <span className="font-mono text-cyan-300 font-bold">{(measuredP * 100).toFixed(3)}%</span>
              </div>
            )}
          </div>

          {/* Target Loss Count (x) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Evaluate Losses (x):</span>
              <span className="text-white font-bold">{x} losses</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.min(n, 30)}
              step="1"
              value={x}
              onChange={(e) => setX(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0</span>
              <span>{Math.round(Math.min(n, 30) / 2)}</span>
              <span>{Math.min(n, 30)}</span>
            </div>
          </div>

          {/* Loss Threshold */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Risk Threshold (T):</span>
              <span className="text-rose-400 font-bold">&gt; {threshold} losses</span>
            </div>
            <input
              type="range"
              min="1"
              max={Math.min(n, 30)}
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="w-full accent-rose-400 bg-slate-800 rounded-lg cursor-pointer h-2"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1</span>
              <span>{Math.round(Math.min(n, 30) / 2)}</span>
              <span>{Math.min(n, 30)}</span>
            </div>
          </div>

        </div>

        {/* Math & Output Cards */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="glass-panel rounded-xl p-3.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase">P(X = {x}) Exact</span>
              <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                {result ? `${(result.prob_exact_x * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                p = {result?.prob_exact_x.toFixed(5)}
              </div>
            </div>

            <div className="glass-panel rounded-xl p-3.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase">P(X ≤ {x}) Cumulative</span>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">
                {result ? `${(result.prob_at_most_x * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                At most {x} losses
              </div>
            </div>

            <div className="glass-panel rounded-xl p-3.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase">P(X ≥ {x}) Upper Tail</span>
              <div className="text-xl font-bold font-mono text-violet-300 mt-1">
                {result ? `${(result.prob_at_least_x * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                At least {x} losses
              </div>
            </div>

            <div className="glass-panel rounded-xl p-3.5">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Threshold Risk &gt; {threshold}</span>
              <div className={`text-xl font-bold font-mono mt-1 ${result && result.prob_exceeding_threshold > 0.05 ? 'text-rose-400' : 'text-slate-300'}`}>
                {result ? `${(result.prob_exceeding_threshold * 100).toFixed(2)}%` : '—'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Excess failure risk
              </div>
            </div>

          </div>

          {/* Statistical Moments */}
          <div className="glass-panel rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div>
              <span className="text-slate-400">Expected E[X]:</span>
              <div className="text-base font-bold text-white mt-0.5">
                {result ? `${result.expected_losses} pkts` : '—'}
              </div>
              <span className="text-[10px] text-slate-500">μ = n · p</span>
            </div>

            <div>
              <span className="text-slate-400">Variance Var(X):</span>
              <div className="text-base font-bold text-white mt-0.5">
                {result ? result.variance : '—'}
              </div>
              <span className="text-[10px] text-slate-500">σ² = np(1-p)</span>
            </div>

            <div>
              <span className="text-slate-400">Std Deviation (σ):</span>
              <div className="text-base font-bold text-cyan-300 mt-0.5">
                {result ? `${result.std_dev} pkts` : '—'}
              </div>
              <span className="text-[10px] text-slate-500">σ = √Var(X)</span>
            </div>

            <div>
              <span className="text-slate-400">P(Zero Loss):</span>
              <div className="text-base font-bold text-emerald-300 mt-0.5">
                {result ? `${(result.prob_zero_losses * 100).toFixed(2)}%` : '—'}
              </div>
              <span className="text-[10px] text-slate-500">(1 - p)^n</span>
            </div>
          </div>

          {/* Substituted Formula Card */}
          <div className="glass-panel-accent rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-violet-300 font-mono">Exact Formula & Arithmetic Substitution</span>
              <span className="text-[10px] font-mono text-slate-400">P(X = x) = C(n, x) · p^x · (1-p)^(n-x)</span>
            </div>
            
            <div className="p-3 rounded-lg bg-slate-900/80 border border-violet-500/20 font-mono text-xs text-cyan-300 overflow-x-auto">
              {result?.substituted_formula}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
              {result?.plain_english_explanation}
            </p>
          </div>

        </div>

      </div>

      {/* Probability Mass Function (PMF) Visualization */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              <span>Probability Mass Function (PMF) Distribution</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact discrete probability P(X = k) for loss counts k in [0, {result?.pmf_distribution?.length ? result.pmf_distribution.length - 1 : 20}].
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-cyan-500/30 border border-cyan-400" />
              <span className="text-slate-300">P(X = k)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-violet-500 border border-violet-400" />
              <span className="text-slate-300">Selected x = {x}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-rose-500/40 border border-rose-500" />
              <span className="text-slate-300">Risk Zone (&gt; {threshold})</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          {result && result.pmf_distribution ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.pmf_distribution} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="k" stroke="#64748B" fontSize={11} tickLine={false} label={{ value: 'Loss Count (k)', position: 'insideBottom', offset: -4, fill: '#64748B', fontSize: 11 }} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F1F5F9', fontSize: '12px' }}
                  formatter={(val: any) => [`${(val * 100).toFixed(4)}%`, 'Probability']}
                  labelFormatter={(k) => `Loss Count k = ${k}`}
                />
                <ReferenceLine x={threshold} stroke="#F43F5E" strokeDasharray="4 4" label={{ value: 'Threshold', fill: '#F43F5E', fontSize: 10, position: 'top' }} />
                <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                  {result.pmf_distribution.map((entry, index) => {
                    let fillColor = '#06B6D4'; // default cyan
                    if (entry.k === x) {
                      fillColor = '#8B5CF6'; // purple marker for selected x
                    } else if (entry.k > threshold) {
                      fillColor = '#E11D48'; // red for threshold
                    }
                    return <Cell key={`cell-${index}`} fill={fillColor} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
              Calculating distribution...
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
