import React from 'react';
import { ShieldCheck, Database, Sliders, Clock, Globe, ExternalLink } from 'lucide-react';
import { LivePulseData } from '../types';

interface BannerProps {
  data?: LivePulseData | null;
  mode?: 'measured' | 'manual';
  manualProb?: number;
}

export const DataIntegrityBanner: React.FC<BannerProps> = ({
  data,
  mode = 'measured',
  manualProb,
}) => {
  if (mode === 'manual') {
    return (
      <div className="bg-violet-950/30 border border-violet-500/30 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between text-xs gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center border border-violet-500/30 flex-shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-violet-300 uppercase tracking-wider text-[11px]">
                Educational Scenario Mode (Hypothetical)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-violet-900/60 text-violet-200 border border-violet-700/50">
                User-Defined p = {manualProb !== undefined ? (manualProb * 100).toFixed(2) : '—'}%
              </span>
            </div>
            <p className="text-slate-400 mt-0.5">
              Probabilities are calculated from user input for educational exploration. Real measurements are preserved separately.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const isRipe = data.source === 'RIPE_ATLAS';
  const isLocal = data.source === 'LOCAL_DIAGNOSTIC';
  const isHistorical = data.source === 'HISTORICAL';

  const msmTime = new Date(data.measurement_timestamp_epoch * 1000).toLocaleString();
  const fetchTime = new Date(data.last_fetched_epoch * 1000).toLocaleTimeString();

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Left: Source & Integrity Badge */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/30 flex-shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white tracking-wide">
                {isRipe && 'RIPE Atlas Verified Measurement'}
                {isLocal && 'Local Device Diagnostic Measurement'}
                {isHistorical && 'Persisted Historical Measurement'}
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                {data.data_integrity}
              </span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              {data.sample_window_description}
            </p>
          </div>
        </div>

        {/* Right: Timestamps & Target Details with Direct Dataset Links */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>Target: <strong className="text-slate-200">{data.target}</strong></span>
            {isRipe && data.measurement_id ? (
              <a
                href={`https://atlas.ripe.net/measurements/${data.measurement_id}/`}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline font-bold flex items-center space-x-0.5 ml-1"
                title="View live dataset on official RIPE Atlas portal"
              >
                <span>MSM #{data.measurement_id}</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            ) : (
              data.measurement_id && <span className="text-slate-500">({data.measurement_id})</span>
            )}
          </div>

          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Measured: <strong className="text-slate-200">{msmTime}</strong></span>
          </div>

          <div className="flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Fetched: <strong className="text-slate-200">{fetchTime}</strong></span>
          </div>

          {/* Direct Raw JSON Dataset Link Button */}
          {isRipe && data.measurement_id && (
            <a
              href={`https://atlas.ripe.net/api/v2/measurements/${data.measurement_id}/latest/?format=json`}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 flex items-center space-x-1 transition-colors"
              title="Inspect raw JSON live dataset feed from RIPE Atlas API"
            >
              <span>Raw Dataset (JSON)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

      </div>
    </div>
  );
};
