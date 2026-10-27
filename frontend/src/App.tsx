import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, TabKey } from './components/Navbar';
import { DataIntegrityBanner } from './components/DataIntegrityBanner';
import { OverviewPage } from './pages/OverviewPage';
import { ExplorerPage } from './pages/ExplorerPage';
import { ProbabilityLabPage } from './pages/ProbabilityLabPage';
import { FingerprintPage } from './pages/FingerprintPage';
import { ValidationPage } from './pages/ValidationPage';
import { ProvenancePage } from './pages/ProvenancePage';
import { DatasetsModal } from './components/DatasetsModal';
import { fetchLivePulse } from './api';
import { LivePulseData } from './types';
import { AlertCircle } from 'lucide-react';

const VALID_TABS: TabKey[] = ['overview', 'explorer', 'probability', 'fingerprint', 'validation', 'provenance'];

function getTabFromUrl(): TabKey {
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (VALID_TABS.includes(hash as TabKey)) {
    return hash as TabKey;
  }
  const path = window.location.pathname.replace(/^\//, '').toLowerCase();
  if (VALID_TABS.includes(path as TabKey)) {
    return path as TabKey;
  }
  return 'overview';
}

export const App: React.FC = () => {
  const [activeTab, setActiveTabState] = useState<TabKey>(getTabFromUrl);
  const [source, setSource] = useState<'RIPE_ATLAS' | 'LOCAL_DIAGNOSTIC' | 'HISTORICAL'>('RIPE_ATLAS');
  const [currentMsmId, setCurrentMsmId] = useState<number>(1001);
  const [currentTarget, setCurrentTarget] = useState<string>('1.1.1.1');
  const [isDatasetsModalOpen, setIsDatasetsModalOpen] = useState<boolean>(false);
  
  const [pulseData, setPulseData] = useState<LivePulseData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync tab changes to URL hash
  const setActiveTab = (tab: TabKey) => {
    setActiveTabState(tab);
    if (window.location.hash !== `#${tab}`) {
      window.location.hash = `#${tab}`;
    }
  };

  // Listen to browser hash and popstate navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const tab = getTabFromUrl();
      setActiveTabState(tab);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Auto-refresh timer state (default 10s for live data)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(10);
  const [countdown, setCountdown] = useState<number>(10);

  const loadData = useCallback(async (force: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLivePulse(source, currentMsmId, currentTarget, force);
      setPulseData(data);
      if (data.target) {
        setCurrentTarget(data.target);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch network pulse telemetry.');
    } finally {
      setIsLoading(false);
      setCountdown(refreshInterval);
    }
  }, [source, currentMsmId, currentTarget, refreshInterval]);

  // Initial load and reload when source, msmId, or target change
  useEffect(() => {
    loadData(true);
  }, [source, currentMsmId, currentTarget]);

  // Countdown timer effect for real-time live auto-update
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadData(true);
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, loadData, refreshInterval]);

  const handleSelectMsmId = (id: number) => {
    setCurrentMsmId(id);
    setSource('RIPE_ATLAS');
    setActiveTab('overview');
    loadData(true);
  };

  const handleRunLocalPing = (target: string, _count: number) => {
    setCurrentTarget(target);
    setSource('LOCAL_DIAGNOSTIC');
    setActiveTab('overview');
    loadData(true);
  };

  const handleSelectHistorical = () => {
    setSource('HISTORICAL');
    setActiveTab('overview');
    loadData(true);
  };

  const handleSourceChange = (newSource: 'RIPE_ATLAS' | 'LOCAL_DIAGNOSTIC' | 'HISTORICAL') => {
    setSource(newSource);
    loadData(true);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Navbar with 6 navigation tabs and live update controls */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        source={source}
        onSourceChange={handleSourceChange}
        isRefreshing={isLoading}
        onRefresh={() => loadData(true)}
        freshnessStatus={pulseData?.freshness_status}
        autoRefreshEnabled={autoRefreshEnabled}
        onToggleAutoRefresh={() => setAutoRefreshEnabled((prev) => !prev)}
        countdown={countdown}
        refreshInterval={refreshInterval}
        onRefreshIntervalChange={(val) => {
          setRefreshInterval(val);
          setCountdown(val);
        }}
        onOpenDatasetsModal={() => setIsDatasetsModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Data Provenance & Integrity Banner */}
        <DataIntegrityBanner
          data={pulseData}
          mode={activeTab === 'probability' ? undefined : 'measured'}
        />

        {/* Global Error Banner if API failed */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => loadData(true)}
              className="px-3 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-white font-mono text-[11px]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Active Page View */}
        {activeTab === 'overview' && (
          <OverviewPage
            data={pulseData}
            isLoading={isLoading}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'explorer' && (
          <ExplorerPage
            currentMsmId={currentMsmId}
            onSelectMsmId={handleSelectMsmId}
            onRunLocalPing={handleRunLocalPing}
            onSelectHistoricalRecord={handleSelectHistorical}
          />
        )}

        {activeTab === 'probability' && (
          <ProbabilityLabPage
            measuredP={pulseData?.estimated_p || 0.0}
            measuredSource={pulseData?.source === 'RIPE_ATLAS' ? 'RIPE Atlas' : 'Local Host'}
          />
        )}

        {activeTab === 'fingerprint' && (
          <FingerprintPage
            source={source === 'HISTORICAL' ? 'RIPE_ATLAS' : source}
            msmId={currentMsmId}
            target={currentTarget}
            lastFetchedEpoch={pulseData?.last_fetched_epoch}
          />
        )}

        {activeTab === 'validation' && (
          <ValidationPage
            source={source === 'HISTORICAL' ? 'RIPE_ATLAS' : source}
            msmId={currentMsmId}
            target={currentTarget}
            lastFetchedEpoch={pulseData?.last_fetched_epoch}
          />
        )}

        {activeTab === 'provenance' && (
          <ProvenancePage />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/40 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            PacketPulse Intelligence • Academic Micro-Project: <em>Binomial Loss Estimation</em>
          </p>
          <p className="text-[11px] text-slate-600">
            Probability & Statistics for Data Science & Cyber Security Engineers
          </p>
        </div>
      </footer>

      {/* Datasets Directory Quick Modal */}
      <DatasetsModal
        isOpen={isDatasetsModalOpen}
        onClose={() => setIsDatasetsModalOpen(false)}
        currentMsmId={currentMsmId}
      />

    </div>
  );
};

export default App;
