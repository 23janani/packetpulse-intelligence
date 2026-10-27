import React from 'react';
import {
  Activity,
  Compass,
  FlaskConical,
  Fingerprint,
  ShieldCheck,
  Info,
  RefreshCw,
  Radio,
  Server,
  Database
} from 'lucide-react';

export type TabKey = 'overview' | 'explorer' | 'probability' | 'fingerprint' | 'validation' | 'provenance';

interface NavbarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  source: 'RIPE_ATLAS' | 'LOCAL_DIAGNOSTIC' | 'HISTORICAL';
  onSourceChange: (source: 'RIPE_ATLAS' | 'LOCAL_DIAGNOSTIC' | 'HISTORICAL') => void;
  isRefreshing: boolean;
  onRefresh: () => void;
  freshnessStatus?: string;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  countdown: number;
  refreshInterval: number;
  onRefreshIntervalChange: (interval: number) => void;
  onOpenDatasetsModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  source,
  onSourceChange,
  isRefreshing,
  onRefresh,
  freshnessStatus = 'LIVE',
  autoRefreshEnabled,
  onToggleAutoRefresh,
  countdown,
  refreshInterval = 10,
  onRefreshIntervalChange,
  onOpenDatasetsModal,
}) => {
  const tabs = [
    { key: 'overview', label: 'Overview', icon: Activity },
    { key: 'explorer', label: 'Measurement Explorer', icon: Compass },
    { key: 'probability', label: 'Probability Laboratory', icon: FlaskConical },
    { key: 'fingerprint', label: 'Loss Fingerprint', icon: Fingerprint },
    { key: 'validation', label: 'Model Validation', icon: ShieldCheck },
    { key: 'provenance', label: 'Data Provenance & About', icon: Info },
  ] as const;

  const freshnessColors: Record<string, string> = {
    LIVE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    RECENT: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    HISTORICAL: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    STALE: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    UNAVAILABLE: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070B14]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand & Tagline */}
          <a href="#overview" className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('overview')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white font-sans">
                  PacketPulse <span className="text-cyan-400">Intelligence</span>
                </span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${freshnessColors[freshnessStatus] || freshnessColors.LIVE}`}>
                  {freshnessStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-wide hidden sm:block">
                Measure Reality • Model Probability • Understand Reliability
              </p>
            </div>
          </a>

          {/* Controls: Datasets Link, Source Switcher, Refresh Interval, Button */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Quick Datasets Directory Modal Trigger */}
            {onOpenDatasetsModal && (
              <button
                onClick={onOpenDatasetsModal}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold shadow-sm transition-all"
                title="View live links to official datasets & raw JSON feeds"
              >
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Datasets</span>
              </button>
            )}

            {/* Source Selector */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-medium">
              <button
                onClick={() => onSourceChange('RIPE_ATLAS')}
                className={`px-2.5 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                  source === 'RIPE_ATLAS'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Official RIPE Atlas public Internet measurements"
              >
                <Radio className="w-3.5 h-3.5" />
                <span className="hidden md:inline">RIPE Atlas</span>
              </button>
              
              <button
                onClick={() => onSourceChange('LOCAL_DIAGNOSTIC')}
                className={`px-2.5 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                  source === 'LOCAL_DIAGNOSTIC'
                    ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Bounded local network diagnostics from current machine"
              >
                <Server className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Local Diag</span>
              </button>

              <button
                onClick={() => onSourceChange('HISTORICAL')}
                className={`px-2.5 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                  source === 'HISTORICAL'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Retained real historical measurements from SQLite database"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                <span className="hidden md:inline">Historical</span>
              </button>
            </div>

            {/* Auto refresh cadence and countdown */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={onToggleAutoRefresh}
                className={`px-2 py-1 rounded transition-colors flex items-center space-x-1.5 ${
                  autoRefreshEnabled
                    ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30'
                    : 'text-slate-500 hover:text-slate-400'
                }`}
                title={autoRefreshEnabled ? 'Auto-refresh active. Click to pause.' : 'Auto-refresh paused. Click to enable.'}
              >
                <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="hidden sm:inline">{autoRefreshEnabled ? `Live (${countdown}s)` : 'Paused'}</span>
              </button>

              <select
                value={refreshInterval}
                onChange={(e) => onRefreshIntervalChange(parseInt(e.target.value, 10))}
                className="bg-transparent text-slate-300 text-xs px-1.5 py-1 focus:outline-none cursor-pointer"
                title="Configurable auto-update interval"
              >
                <option value={5} className="bg-slate-900 text-slate-200">5s (Live)</option>
                <option value={10} className="bg-slate-900 text-slate-200">10s (Fast)</option>
                <option value={30} className="bg-slate-900 text-slate-200">30s</option>
                <option value={60} className="bg-slate-900 text-slate-200">60s</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 transition-all disabled:opacity-50"
              title="Force immediate live measurement fetch now"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab navigation bar */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none text-xs sm:text-sm font-medium">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <a
                key={tab.key}
                href={`#${tab.key}`}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
