import React, { useState, useEffect } from 'react';
import {
  Compass,
  Search,
  Server,
  Database,
  Radio,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  fetchPublicMeasurements,
  fetchHistoricalRecords,
  executeLocalDiagnostic
} from '../api';
import { PublicMeasurementItem } from '../types';

interface ExplorerPageProps {
  currentMsmId: number;
  onSelectMsmId: (id: number) => void;
  onRunLocalPing: (target: string, count: number) => void;
  onSelectHistoricalRecord: () => void;
}

export const ExplorerPage: React.FC<ExplorerPageProps> = ({
  currentMsmId,
  onSelectMsmId,
  onRunLocalPing,
  onSelectHistoricalRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [publicList, setPublicList] = useState<PublicMeasurementItem[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [customIdInput, setCustomIdInput] = useState('');
  const [localTarget, setLocalTarget] = useState('1.1.1.1');
  const [localCount, setLocalCount] = useState(10);
  const [isExecutingLocal, setIsExecutingLocal] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const curatedAnchors = [
    {
      id: 1001,
      target: 'k.root-servers.net',
      title: 'DNS Root Server K',
      desc: 'Global Anycast IPv4 measurement (14,000+ active probes worldwide)'
    },
    {
      id: 1004,
      target: 'f.root-servers.net',
      title: 'DNS Root Server F',
      desc: 'Global Anycast IPv4 measurement run across RIPE NCC network'
    },
    {
      id: 1999544,
      target: '8.8.8.8',
      title: 'Google Public DNS',
      desc: 'Multi-probe continuous ICMP probe targeting Google Anycast resolver'
    },
    {
      id: 11908848,
      target: '1.1.1.1',
      title: 'Cloudflare Public DNS',
      desc: 'Public worldwide ping measurement to Cloudflare recursive DNS'
    }
  ];

  useEffect(() => {
    loadPublicList();
    loadHistoryList();
  }, []);

  async function loadPublicList(query?: string) {
    try {
      const res = await fetchPublicMeasurements(query, 12);
      setPublicList(res);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadHistoryList() {
    try {
      const res = await fetchHistoricalRecords(10);
      setHistoryList(res);
    } catch (err) {
      console.error(err);
    }
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customIdInput.trim(), 10);
    if (!isNaN(parsed) && parsed > 0) {
      onSelectMsmId(parsed);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadPublicList(searchTerm.trim() || undefined);
  };

  const handleLocalPingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExecutingLocal(true);
    setLocalMessage(null);
    try {
      await executeLocalDiagnostic(localTarget, localCount);
      setLocalMessage(`Successfully probed ${localTarget} (${localCount} packets). Updated telemetry!`);
      onRunLocalPing(localTarget, localCount);
      loadHistoryList();
    } catch (err: any) {
      setLocalMessage(`Probe error: ${err.message}`);
    } finally {
      setIsExecutingLocal(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center space-x-2.5">
          <Compass className="w-6 h-6 text-cyan-400" />
          <span>Measurement Explorer</span>
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Discover verified public RIPE Atlas measurements or initiate local device diagnostics.
        </p>
      </div>

      {/* Section 1: Curated Public Anchors */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>Verified RIPE Atlas Ongoing Anchors</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {curatedAnchors.map((anchor) => {
            const isSelected = currentMsmId === anchor.id;
            return (
              <div
                key={anchor.id}
                onClick={() => onSelectMsmId(anchor.id)}
                className={`cursor-pointer rounded-xl p-4 transition-all border ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'glass-panel hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{anchor.title}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                    ID #{anchor.id}
                  </span>
                </div>
                <div className="text-xs font-mono text-cyan-400 mt-1">{anchor.target}</div>
                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center text-xs font-semibold text-cyan-300 space-x-1">
                    <span>{isSelected ? 'Currently Selected' : 'Select Measurement'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex items-center space-x-2 text-[11px] font-mono" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`https://atlas.ripe.net/measurements/${anchor.id}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center space-x-1"
                      title="Open official RIPE Atlas dataset webpage"
                    >
                      <span>RIPE Atlas ↗</span>
                    </a>
                    <span className="text-slate-600">•</span>
                    <a
                      href={`https://atlas.ripe.net/api/v2/measurements/${anchor.id}/latest/?format=json`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-violet-400 hover:text-violet-300 hover:underline flex items-center space-x-1"
                      title="View raw JSON API dataset"
                    >
                      <span>Raw JSON ↗</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Custom ID & Public Search Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Custom RIPE Measurement ID */}
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Load Custom RIPE Atlas Measurement</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Enter any public Ongoing Ping Measurement ID from <a href="https://atlas.ripe.net/measurements/" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">atlas.ripe.net</a>.
          </p>

          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <input
              type="number"
              placeholder="e.g. 1001 or 1999544"
              value={customIdInput}
              onChange={(e) => setCustomIdInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
            >
              Load ID
            </button>
          </form>
        </div>

        {/* Local Diagnostics Trigger */}
        <div className="glass-panel rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-2 flex items-center space-x-2">
            <Server className="w-4 h-4 text-violet-400" />
            <span>Local Device Diagnostics</span>
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            Execute a bounded diagnostic ping directly from this host to a validated endpoint.
          </p>

          <form onSubmit={handleLocalPingSubmit} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Target Host or IP (e.g. 1.1.1.1)"
                value={localTarget}
                onChange={(e) => setLocalTarget(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-400 font-mono"
              />
              <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded-xl px-3 text-xs text-slate-300 font-mono">
                <span>Pkts:</span>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={localCount}
                  onChange={(e) => setLocalCount(parseInt(e.target.value, 10) || 10)}
                  className="w-12 bg-transparent text-white font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                Bounded to 3–20 packets with strict regex sanitization.
              </span>
              <button
                type="submit"
                disabled={isExecutingLocal}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isExecutingLocal ? 'Probing...' : 'Run Diagnostics'}</span>
              </button>
            </div>
          </form>

          {localMessage && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center space-x-2">
              {localMessage.includes('error') ? (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span>{localMessage}</span>
            </div>
          )}
        </div>

      </div>

      {/* Section 3: Historical Measurements Stored in SQLite */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-amber-400" />
              <span>Persisted Historical Measurements (SQLite)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified records retrieved and stored locally with original epoch timestamps.
            </p>
          </div>
          <a
            href="#overview"
            onClick={onSelectHistoricalRecord}
            className="text-xs text-amber-400 hover:underline font-mono cursor-pointer"
          >
            Inspect in Pulse View →
          </a>
        </div>

        {historyList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 font-mono">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Record ID</th>
                  <th className="py-2.5 px-3">Source Type</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3 text-right">Sent</th>
                  <th className="py-2.5 px-3 text-right">Rcvd</th>
                  <th className="py-2.5 px-3 text-right">Loss Rate</th>
                  <th className="py-2.5 px-3 text-right">Avg RTT</th>
                  <th className="py-2.5 px-3 text-right">Recorded At (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {historyList.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-400">#{h.id}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-300">
                        {h.source_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-white">{h.target}</td>
                    <td className="py-2.5 px-3 text-right">{h.total_sent}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">{h.successful_rcvd}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${h.loss_percentage > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {h.loss_percentage.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-violet-300">
                      {h.avg_rtt !== null ? `${h.avg_rtt} ms` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-500">
                      {h.recorded_at ? h.recorded_at.replace('T', ' ').slice(0, 19) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500 text-xs font-mono py-4 text-center">
            No historical records saved yet. Live telemetry will automatically populate this database.
          </p>
        )}
      </div>

    </div>
  );
};
