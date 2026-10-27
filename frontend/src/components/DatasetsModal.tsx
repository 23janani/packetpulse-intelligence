import React from 'react';
import { Database, ExternalLink, X, Radio, Server, FileJson, CheckCircle2 } from 'lucide-react';

interface DatasetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMsmId?: number;
}

export const DatasetsModal: React.FC<DatasetsModalProps> = ({ isOpen, onClose, currentMsmId }) => {
  if (!isOpen) return null;

  const ripeDatasets = [
    {
      id: 1001,
      target: 'k.root-servers.net',
      title: 'DNS Root Server K',
      probes: '14,000+ Global Vantage Probes',
      desc: 'Global Anycast DNS root server monitored 24/7 by RIPE NCC infrastructure.',
      webUrl: 'https://atlas.ripe.net/measurements/1001/',
      apiUrl: 'https://atlas.ripe.net/api/v2/measurements/1001/latest/?format=json',
    },
    {
      id: 1999544,
      target: '8.8.8.8',
      title: 'Google Public DNS',
      probes: 'Multi-continent Probe Fleet',
      desc: 'Continuous real-world ICMP probes targeting Google Anycast DNS resolver.',
      webUrl: 'https://atlas.ripe.net/measurements/1999544/',
      apiUrl: 'https://atlas.ripe.net/api/v2/measurements/1999544/latest/?format=json',
    },
    {
      id: 11908848,
      target: '1.1.1.1',
      title: 'Cloudflare Public DNS',
      probes: 'Worldwide Active Probes',
      desc: 'Live telemetry stream measuring latency and packet loss to Cloudflare 1.1.1.1.',
      webUrl: 'https://atlas.ripe.net/measurements/11908848/',
      apiUrl: 'https://atlas.ripe.net/api/v2/measurements/11908848/latest/?format=json',
    },
    {
      id: 1004,
      target: 'f.root-servers.net',
      title: 'DNS Root Server F',
      probes: 'Global Anycast Probes',
      desc: 'Critical Internet root name server measurement operated by ISC / RIPE NCC.',
      webUrl: 'https://atlas.ripe.net/measurements/1004/',
      apiUrl: 'https://atlas.ripe.net/api/v2/measurements/1004/latest/?format=json',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="glass-panel w-full max-w-3xl rounded-2xl p-6 border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-500/40">
              <Database className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Official Real-World Datasets Directory</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/50 px-2 py-0.5 rounded-full font-mono">
                  VERIFIED REAL DATA
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every measurement in PacketPulse Intelligence originates from these official public telemetry feeds.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Datasets List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 font-mono">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>RIPE Atlas Global Telemetry Datasets</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {ripeDatasets.map((ds) => {
              const isCurrent = currentMsmId === ds.id;
              return (
                <div
                  key={ds.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{ds.title}</span>
                    <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded">
                      MSM #{ds.id}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-cyan-400 mt-0.5">{ds.target}</div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{ds.desc}</p>
                  
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <a
                      href={ds.webUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 hover:underline font-medium"
                    >
                      <span>Web Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    
                    <a
                      href={ds.apiUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 text-violet-400 hover:text-violet-300 hover:underline font-mono text-[11px]"
                    >
                      <FileJson className="w-3 h-3" />
                      <span>Raw JSON Feed</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Local Persisted & System APIs */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 font-mono">
            <Server className="w-4 h-4 text-violet-400" />
            <span>Application Backend & Historical Endpoints</span>
          </h3>

          <div className="space-y-2 text-xs font-mono">
            
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-400">SQLite Historical Records: </span>
                <span className="text-slate-400">All saved real-world network measurement runs</span>
              </div>
              <a
                href="/api/v1/measurements/history"
                target="_blank"
                rel="noreferrer"
                className="text-amber-400 hover:text-amber-300 underline font-bold flex items-center space-x-1"
              >
                <span>/api/v1/measurements/history</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-emerald-400">RIPE Atlas REST Discovery: </span>
                <span className="text-slate-400">Official live ping measurements search</span>
              </div>
              <a
                href="https://atlas.ripe.net/api/v2/measurements/?type=ping&status=Ongoing"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline font-bold flex items-center space-x-1"
              >
                <span>RIPE API Query</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-cyan-400">RIPE Atlas Official Docs: </span>
                <span className="text-slate-400">API schemas, probe architectures, measurement formats</span>
              </div>
              <a
                href="https://atlas.ripe.net/docs/apis/rest-api-reference/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 underline font-bold flex items-center space-x-1"
              >
                <span>API Reference ↗</span>
              </a>
            </div>

          </div>
        </div>

        {/* Footer Notice */}
        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            Every dataset link above is active, publicly verifiable, and requires zero private API keys to audit.
          </span>
        </div>

      </div>
    </div>
  );
};
