import React, { useState, useEffect } from 'react';
import {
  FileText,
  Database,
  ExternalLink,
  BookOpen,
  Code2,
  Terminal,
  ShieldAlert,
  Cpu
} from 'lucide-react';
import { fetchProvenanceData } from '../api';

export const ProvenancePage: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchProvenanceData()
      .then(setData)
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <span>Data Provenance & Mathematical Foundation</span>
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Academic documentation, verified external measurement pipelines, and probability theory formulations.
        </p>
      </div>

      {/* Project Overview Card */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Academic Micro-Project Specification</span>
        </div>
        
        <h2 className="text-xl font-bold text-white">
          PacketPulse Intelligence — Live Network Loss Estimation & Probabilistic Anomaly Detection
        </h2>
        
        <p className="text-slate-300 text-sm leading-relaxed">
          This platform was engineered for the academic micro-project <strong className="text-white">“Packet Loss Estimation in Data Networks Using Binomial Distribution”</strong> within <em>Probability and Statistics for Data Science and Cyber Security Engineers</em>. It bridges empirical wide-area Internet telemetry with discrete probability distributions, non-parametric runs tests, and explainable network health diagnostics.
        </p>

        <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200">
          <strong className="text-white">Primary Core Principle: REAL DATA FIRST. </strong>
          No synthetic live metrics, fabricated timestamps, invented probe IDs, or mock loss rates are generated in live mode. Telemetry originates strictly from official RIPE Atlas APIs or local device diagnostic execution.
        </div>
      </div>

      {/* Direct Dataset Links Directory */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ExternalLink className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Live Real-World Datasets Directory</h2>
          </div>
          <span className="text-xs font-mono text-cyan-400">Click any dataset to open</span>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">
          The application directly interfaces with verified, public Internet measurements. Any evaluator or researcher can independently inspect these official datasets:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-mono text-xs">
          
          {/* Dataset 1 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">DNS Root Server K</span>
                <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.5 rounded">MSM #1001</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">k.root-servers.net (Global Anycast, 14,000+ probes)</span>
            </div>
            <div className="flex items-center space-x-3 pt-1 text-[11px]">
              <a
                href="https://atlas.ripe.net/measurements/1001/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <span>Official Web Portal ↗</span>
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="https://atlas.ripe.net/api/v2/measurements/1001/latest/?format=json"
                target="_blank"
                rel="noreferrer"
                className="text-violet-400 hover:underline flex items-center space-x-1"
              >
                <span>Raw JSON Feed ↗</span>
              </a>
            </div>
          </div>

          {/* Dataset 2 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Google Public DNS</span>
                <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.5 rounded">MSM #1999544</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Target: 8.8.8.8 (Global Anycast Resolver)</span>
            </div>
            <div className="flex items-center space-x-3 pt-1 text-[11px]">
              <a
                href="https://atlas.ripe.net/measurements/1999544/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <span>Official Web Portal ↗</span>
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="https://atlas.ripe.net/api/v2/measurements/1999544/latest/?format=json"
                target="_blank"
                rel="noreferrer"
                className="text-violet-400 hover:underline flex items-center space-x-1"
              >
                <span>Raw JSON Feed ↗</span>
              </a>
            </div>
          </div>

          {/* Dataset 3 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Cloudflare Public DNS</span>
                <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.5 rounded">MSM #11908848</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">Target: 1.1.1.1 (Global Anycast Resolver)</span>
            </div>
            <div className="flex items-center space-x-3 pt-1 text-[11px]">
              <a
                href="https://atlas.ripe.net/measurements/11908848/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <span>Official Web Portal ↗</span>
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="https://atlas.ripe.net/api/v2/measurements/11908848/latest/?format=json"
                target="_blank"
                rel="noreferrer"
                className="text-violet-400 hover:underline flex items-center space-x-1"
              >
                <span>Raw JSON Feed ↗</span>
              </a>
            </div>
          </div>

          {/* Dataset 4 */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">DNS Root Server F</span>
                <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800 px-1.5 py-0.5 rounded">MSM #1004</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">f.root-servers.net (Global Anycast Root Server)</span>
            </div>
            <div className="flex items-center space-x-3 pt-1 text-[11px]">
              <a
                href="https://atlas.ripe.net/measurements/1004/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center space-x-1"
              >
                <span>Official Web Portal ↗</span>
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="https://atlas.ripe.net/api/v2/measurements/1004/latest/?format=json"
                target="_blank"
                rel="noreferrer"
                className="text-violet-400 hover:underline flex items-center space-x-1"
              >
                <span>Raw JSON Feed ↗</span>
              </a>
            </div>
          </div>

        </div>

        {/* Database JSON endpoint */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-amber-400">SQLite Historical Export:</span>
            <span className="text-slate-400">Local Persisted Measurement History API</span>
          </div>
          <a
            href="/api/v1/measurements/history"
            target="_blank"
            rel="noreferrer"
            className="text-amber-400 hover:underline font-bold flex items-center space-x-1"
          >
            <span>/api/v1/measurements/history ↗</span>
          </a>
        </div>
      </div>

      {/* External Data Source Documentation */}
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-bold text-white">Official Data Source: RIPE Atlas</h2>
          </div>
          <a
            href="https://atlas.ripe.net/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-cyan-400 hover:underline flex items-center space-x-1"
          >
            <span>atlas.ripe.net</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase text-[10px]">Official API Base URL</span>
            <div className="text-cyan-300 font-bold">https://atlas.ripe.net/api/v2</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 uppercase text-[10px]">Measurement Types</span>
            <div className="text-white font-bold">Ongoing ICMP Ping Measurements</div>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
          <h3 className="font-bold text-white text-sm">Documented API Endpoints & Query Pattern:</h3>
          <ul className="list-disc pl-5 space-y-1.5 font-mono text-[11px] text-slate-400">
            <li>
              <code className="text-cyan-300">GET /api/v2/measurements/?type=ping&status=Ongoing&page_size=10</code> — Queries active ongoing ping measurements across verified public targets.
            </li>
            <li>
              <code className="text-cyan-300">GET /api/v2/measurements/&#123;id&#125;/latest/?format=json</code> — Fetches verified latest results from participating hardware and software probes across the world.
            </li>
          </ul>

          <h3 className="font-bold text-white text-sm pt-2">Fields Retrieved & Mathematical Interpretation:</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Field</th>
                  <th className="py-2 px-3">Units</th>
                  <th className="py-2 px-3">Operational Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-2 px-3 text-cyan-300">sent</td>
                  <td className="py-2 px-3">packets</td>
                  <td className="py-2 px-3">Total ICMP echo request probe attempts dispatched in measurement batch</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-emerald-300">rcvd</td>
                  <td className="py-2 px-3">replies</td>
                  <td className="py-2 px-3">Echo replies received before timeout</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-rose-300">lost</td>
                  <td className="py-2 px-3">packets</td>
                  <td className="py-2 px-3">Calculated: max(0, sent - rcvd); empirical failure count</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-violet-300">avg / min / max</td>
                  <td className="py-2 px-3">milliseconds (ms)</td>
                  <td className="py-2 px-3">Round-trip latency across all successful ping replies</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-slate-400">timestamp</td>
                  <td className="py-2 px-3">epoch seconds</td>
                  <td className="py-2 px-3">Original measurement generation timestamp preserved in UTC</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mathematical Foundation & Formulas */}
      <div className="glass-panel-accent rounded-2xl p-6 space-y-4">
        <div className="flex items-center space-x-2 text-violet-300">
          <Code2 className="w-5 h-5 text-violet-400" />
          <h2 className="text-base font-bold text-white">Mathematical Foundation: Discrete Probability Modeling</h2>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed font-sans">
          
          <div>
            <h3 className="font-bold text-white text-sm">1. Bernoulli Trials Formulation</h3>
            <p className="mt-1 text-slate-400">
              A sequence of network transmission attempts is modeled as a sequence of discrete trials $X_1, X_2, \dots, X_n$.
              For each attempt $i$, the outcome is binary:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900/80 font-mono text-cyan-300 mt-1">
              X_i = 1 (Packet Drop / Timeout, with probability p) <br/>
              X_i = 0 (Echo Reply Received, with probability 1 - p)
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm">2. Binomial Distribution & Moments</h3>
            <p className="mt-1 text-slate-400">
              The total packet losses X = Σ(X_i) for i=1..n in a batch of n trials follows a Binomial distribution X ~ Binomial(n, p):
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900/80 font-mono text-cyan-300 mt-1 space-y-1">
              <div>Probability Mass Function: P(X = x) = C(n, x) · p^x · (1 - p)^(n - x)</div>
              <div>Expected Value: E[X] = μ = n · p</div>
              <div>Variance: Var(X) = σ² = n · p · (1 - p)</div>
              <div>Standard Deviation: σ = √[n · p · (1 - p)]</div>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm">3. Parameter Estimation & Wilson Score Confidence Interval</h3>
            <p className="mt-1 text-slate-400">
              Given N empirical observations with K drops, the maximum likelihood estimator is p̂ = K / N.
              Because network loss rates are typically small (p &lt; 0.05), the standard Wald normal approximation suffers severe under-coverage. The Wilson Score Interval provides asymmetric, exact coverage:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900/80 font-mono text-violet-300 mt-1">
              p̃ = (p̂ + z² / (2N)) / (1 + z² / N) <br/>
              CI = p̃ ± (z / (1 + z² / N)) · √[ p̂(1 - p̂)/N + z² / (4N²) ]
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white text-sm">4. Wald-Wolfowitz Non-Parametric Runs Test for Independence</h3>
            <p className="mt-1 text-slate-400">
              To test the Binomial assumption that packet drops are mutually independent (memoryless), the Wald-Wolfowitz runs test evaluates whether the count of alternating contiguous runs $R$ deviates from the theoretical mean:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900/80 font-mono text-cyan-300 mt-1">
              E[R] = 1 + (2 · N0 · N1) / N <br/>
              Var(R) = [2 · N0 · N1 · (2 · N0 · N1 - N)] / [N² · (N - 1)] <br/>
              Z = (R - E[R] ± 0.5) / √Var(R)
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
            <strong className="text-slate-300">Model Limitation: </strong>
            In real congested routers, packet drops often occur in bursts due to drop-tail queue overflow. When burstiness is detected (Z &lt; -1.96), independent Bernoulli assumptions will underestimate the risk of consecutive dropped packets. In future work, Markov-modulated models (such as the Gilbert-Elliott two-state Markov chain) can be calibrated against this baseline.
          </div>

        </div>
      </div>

      {/* Reproducibility Commands */}
      <div className="glass-panel rounded-2xl p-6 space-y-3 font-mono text-xs">
        <div className="flex items-center space-x-2 text-emerald-400 font-bold">
          <Terminal className="w-4 h-4" />
          <span>Independent Verification Commands</span>
        </div>
        <p className="text-slate-400 font-sans text-xs">
          An evaluator can reproduce and verify external measurements independently via curl or Python:
        </p>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 overflow-x-auto">
          curl -s "https://atlas.ripe.net/api/v2/measurements/1001/latest/?format=json" | jq '.[0] | &#123;msm_id, prb_id, dst_name, sent, rcvd, avg, timestamp&#125;'
        </div>
      </div>

    </div>
  );
};
