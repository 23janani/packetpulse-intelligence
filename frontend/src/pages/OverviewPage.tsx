import React from 'react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  Percent,
  Clock,
  Gauge,
  TrendingDown,
  Info,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { LivePulseData } from '../types';

interface OverviewPageProps {
  data: LivePulseData | null;
  isLoading: boolean;
  onNavigateToTab: (tab: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  data,
  isLoading,
  onNavigateToTab,
}) => {
  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <p className="text-slate-400 font-mono text-sm">Querying verified network telemetry...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center my-8">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">No Telemetry Available</h3>
        <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
          Could not retrieve verified measurements. Check network connectivity or select an alternative data source.
        </p>
      </div>
    );
  }

  // Generate chart data from latency observations
  const rttData = (data.rtt_series || []).map((rtt, idx) => ({
    attempt: idx + 1,
    latency: rtt,
    status: (data.sequential_attempts || [])[idx] === 1 ? 'Dropped' : 'Replied'
  }));

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Pulse Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
            <span>Live Network Pulse</span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 live-indicator" />
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Empirical ping telemetry from <strong className="text-slate-200">{data.source === 'RIPE_ATLAS' ? 'RIPE Atlas Global Probes' : data.target}</strong>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="#probability"
            onClick={() => onNavigateToTab('probability')}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Launch Binomial Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Feature A: Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Attempts */}
        <div className="glass-panel rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Probe Attempts</span>
            <Send className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {data.total_sent.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Sent packets</span>
            <span className="text-cyan-400 font-mono">{data.total_probes_or_attempts} probes</span>
          </div>
        </div>

        {/* Successful Replies */}
        <div className="glass-panel rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Replies Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 tracking-tight">
            {data.successful_replies.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Success rate</span>
            <span className="text-emerald-400 font-mono">
              {data.total_sent > 0 ? ((data.successful_replies / data.total_sent) * 100).toFixed(1) : '100'}%
            </span>
          </div>
        </div>

        {/* Failed / Dropped Probes */}
        <div className="glass-panel rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Observed Loss</span>
            <AlertTriangle className={`w-4 h-4 ${data.failed_losses > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono tracking-tight ${data.failed_losses > 0 ? 'text-rose-300' : 'text-slate-200'}`}>
            {data.failed_losses}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Loss Rate (p̂)</span>
            <span className={`font-mono font-bold ${data.observed_loss_percentage > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {data.observed_loss_percentage.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Round Trip Latency */}
        <div className="glass-panel rounded-xl p-4 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Latency (RTT)</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-violet-300 tracking-tight">
            {data.avg_rtt_ms !== null && data.avg_rtt_ms !== undefined ? `${data.avg_rtt_ms} ms` : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Median: {data.median_rtt_ms ?? '—'} ms</span>
            <span className="text-violet-400 font-mono">p95: {data.p95_rtt_ms ?? '—'} ms</span>
          </div>
        </div>

      </div>

      {/* Latency and Status Timeline Chart */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Gauge className="w-4 h-4 text-cyan-400" />
              <span>Round-Trip Time & Attempt Sequence</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical latency (ms) for consecutive probe attempts over the observation batch.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-slate-300">RTT Latency</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300">Packet Drop</span>
            </div>
          </div>
        </div>

        <div className="h-56 w-full">
          {rttData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rttData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="attempt" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="ms" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', color: '#F1F5F9', fontSize: '12px' }}
                  formatter={(value: any) => [`${value} ms`, 'Round-Trip Time']}
                  labelFormatter={(lbl) => `Attempt #${lbl}`}
                />
                <Line
                  type="monotone"
                  dataKey="latency"
                  stroke="#00F2FE"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#00F2FE' }}
                  activeDot={{ r: 6, fill: '#38BDF8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
              No RTT timeline points available for this measurement.
            </div>
          )}
        </div>
      </div>

      {/* Middle Grid: Explainable Alerts & Quick Binomial Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Explainable Alerts */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5">
          <h2 className="text-base font-bold text-white flex items-center space-x-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Explainable Network Health Insights</span>
          </h2>
          <div className="space-y-3">
            {data.alerts && data.alerts.length > 0 ? (
              data.alerts.map((alert, idx) => {
                const borderColors = {
                  HEALTHY: 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200',
                  INFO: 'border-cyan-500/30 bg-cyan-950/20 text-cyan-200',
                  WARNING: 'border-amber-500/30 bg-amber-950/20 text-amber-200',
                  CRITICAL: 'border-rose-500/30 bg-rose-950/20 text-rose-200',
                };
                return (
                  <div key={idx} className={`p-3.5 rounded-xl border ${borderColors[alert.level]} text-xs`}>
                    <div className="font-bold flex items-center justify-between">
                      <span>{alert.title}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900/60">
                        {alert.level}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-300 leading-relaxed font-sans">{alert.message}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-400 text-xs font-mono">No active alerts.</p>
            )}

            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Methodological Note: </span>
              Metrics represent empirical ICMP echo probes. Pacing and endpoint ICMP deprioritization can impact loss rate independent of payload traffic.
            </div>
          </div>
        </div>

        {/* Statistical Summary Box */}
        <div className="glass-panel-accent rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-violet-300 flex items-center space-x-2">
              <Percent className="w-4 h-4 text-violet-400" />
              <span>Statistical Modeling Baseline</span>
            </h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Based on empirical estimate <strong>p̂ = {(data.estimated_p * 100).toFixed(2)}%</strong> across <strong>{data.total_sent}</strong> attempts:
            </p>

            <div className="mt-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-violet-500/20">
                <span className="text-slate-400">Future batch size (n):</span>
                <span className="text-white font-bold">100 packets</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-violet-500/20">
                <span className="text-slate-400">Expected losses E[X]:</span>
                <span className="text-violet-300 font-bold">{(100 * data.estimated_p).toFixed(2)} pkts</span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-violet-500/20">
                <span className="text-slate-400">Std Deviation (σ):</span>
                <span className="text-cyan-300 font-bold">
                  {Math.sqrt(100 * data.estimated_p * (1 - data.estimated_p)).toFixed(2)} pkts
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-lg bg-slate-900/60 border border-violet-500/20">
                <span className="text-slate-400">P(0 losses in 100 pkts):</span>
                <span className="text-emerald-300 font-bold">
                  {(Math.pow(1 - data.estimated_p, 100) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <a
            href="#probability"
            onClick={() => onNavigateToTab('probability')}
            className="mt-5 w-full py-2.5 rounded-xl bg-violet-600/30 hover:bg-violet-600/50 border border-violet-500/40 text-violet-200 text-xs font-bold transition-all text-center block cursor-pointer"
          >
            Explore in Probability Lab →
          </a>
        </div>

      </div>

      {/* Verified Probe Observations Table */}
      {data.probes && data.probes.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Verified Observations</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Individual participating probe measurements contributing to current pulse metrics.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Showing {data.probes.length} probe samples
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Probe ID</th>
                  <th className="py-2.5 px-3">Target / Dest</th>
                  <th className="py-2.5 px-3 text-right">Sent</th>
                  <th className="py-2.5 px-3 text-right">Rcvd</th>
                  <th className="py-2.5 px-3 text-right">Lost</th>
                  <th className="py-2.5 px-3 text-right">Loss Rate</th>
                  <th className="py-2.5 px-3 text-right">Avg RTT</th>
                  <th className="py-2.5 px-3 text-right">Min / Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.probes.slice(0, 10).map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-cyan-400">#{p.probe_id}</td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-[150px]">{p.dst_addr || p.target}</td>
                    <td className="py-2.5 px-3 text-right">{p.sent}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">{p.rcvd}</td>
                    <td className={`py-2.5 px-3 text-right ${p.lost > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}`}>
                      {p.lost}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${p.loss_rate > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {(p.loss_rate * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-violet-300">
                      {p.avg_rtt !== null ? `${p.avg_rtt} ms` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {p.min_rtt !== null ? `${p.min_rtt} / ${p.max_rtt} ms` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
