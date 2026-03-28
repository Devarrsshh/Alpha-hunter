'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Project } from '@/lib/supabase';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';

const CHAINS: { key: string; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'solana',      label: 'Solana' },
  { key: 'eth',         label: 'Ethereum' },
  { key: 'base',        label: 'Base' },
  { key: 'arbitrum',    label: 'Arbitrum' },
  { key: 'bnb',         label: 'BNB' },
  { key: 'polygon',     label: 'Polygon' },
  { key: 'avalanche',   label: 'Avalanche' },
  { key: 'sui',         label: 'Sui' },
  { key: 'aptos',       label: 'Aptos' },
  { key: 'ton',         label: 'TON' },
  { key: 'blast',       label: 'Blast' },
  { key: 'scroll',      label: 'Scroll' },
  { key: 'zksync',      label: 'zkSync' },
  { key: 'linea',       label: 'Linea' },
  { key: 'mantle',      label: 'Mantle' },
  { key: 'berachain',   label: 'Berachain' },
  { key: 'sonic',       label: 'Sonic' },
  { key: 'megaeth',     label: 'MegaETH' },
  { key: 'abstract',    label: 'Abstract' },
  { key: 'hyperliquid', label: 'Hyperliquid' },
];

function formatRelative(date: Date): string {
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] shrink-0">
      <span className="text-lg font-bold font-mono text-white">{value}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5 whitespace-nowrap">{label}</span>
    </div>
  );
}

export default function AlphaFeed() {
  const [projects,         setProjects]         = useState<Project[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]       = useState(false);
  const [filterChain,      setFilterChain]      = useState('all');
  const [search,           setSearch]           = useState('');
  const [selectedProject,  setSelectedProject]  = useState<Project | null>(null);
  const [lastScan,         setLastScan]         = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const chainBarRef = useRef<HTMLDivElement>(null);

  // Re-render every minute so relative time stays fresh
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const fetchProjects = useCallback(async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('score', { ascending: false });

    if (!error && data) {
      setProjects(data as Project[]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleScan = async () => {
    setRefreshing(true);
    try {
      const res  = await fetch('/api/fetch-tweets');
      const json = await res.json();
      if (json.success) {
        setLastScan(new Date());
        await fetchProjects();
      } else {
        console.error('Scan error:', json.error);
        setRefreshing(false);
      }
    } catch (err) {
      console.error(err);
      setRefreshing(false);
    }
  };

  const filtered = projects.filter((p) => {
    const matchChain  = filterChain === 'all' || p.chain?.toLowerCase() === filterChain;
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.summary?.toLowerCase().includes(search.toLowerCase());
    return matchChain && matchSearch;
  });

  const hypeLevels = projects.map((p) => p.hype_level).filter((h) => h != null) as number[];
  const topHype    = hypeLevels.length ? `${Math.max(...hypeLevels)}/10` : '—';
  const chainCount = new Set(projects.map((p) => p.chain?.toLowerCase()).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-[#080b14]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#080b14]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-sm">🎯</span>
              </div>
              <div>
                <div className="text-sm font-bold text-white leading-none">Alpha Hunter</div>
                <div className="text-[10px] text-slate-500 leading-none mt-0.5">AI Signal Feed</div>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-xs hidden sm:block">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white/[0.05] border border-white/[0.09] rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleScan}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40"
              >
                {refreshing ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Scanning...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Run Scan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Hero stats ── */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Crypto Alpha Feed</h1>
          <p className="text-sm text-slate-500 mb-5">
            AI-extracted signals from 33 top crypto alpha hunters — ranked by score
          </p>
          <div className="flex flex-wrap gap-2">
            <StatPill label="Early Projects" value={projects.length} />
            <StatPill label="Hype Score"    value={topHype} />
            <StatPill label="Hunters"       value={33} />
            <StatPill label="Chains"        value={chainCount} />
            <StatPill label="Last Updated"  value={lastScan ? formatRelative(lastScan) : '—'} />
          </div>
        </div>

        {/* ── Filter bar — horizontally scrollable ── */}
        <div className="mb-6 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium shrink-0">Chain</span>
            {/* Scrollable pill row */}
            <div
              ref={chainBarRef}
              className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {CHAINS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterChain(key)}
                  className={[
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap shrink-0',
                    filterChain === key
                      ? 'bg-indigo-600 text-white shadow shadow-indigo-500/30'
                      : 'bg-white/[0.04] text-slate-500 hover:bg-white/[0.08] hover:text-slate-300',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-600 shrink-0 pl-2 border-l border-white/[0.06]">
              {filtered.length}/{projects.length}
            </span>
          </div>
        </div>

        {/* ── Mobile search ── */}
        <div className="block sm:hidden mb-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white/[0.05] border border-white/[0.09] rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-colors"
            />
          </div>
        </div>

        {/* ── Feed ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500">Loading alpha signals...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="text-4xl">🔭</div>
            <p className="text-base font-medium text-slate-400">No signals found</p>
            <p className="text-sm text-slate-600 max-w-xs">
              {projects.length === 0
                ? 'Hit "Run Scan" to fetch tweets and extract alpha signals from the hunters.'
                : 'Try adjusting your filters or search query.'}
            </p>
            {projects.length === 0 && (
              <button
                onClick={handleScan}
                disabled={refreshing}
                className="mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Run First Scan
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                rank={i + 1}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </div>
        )}

        {/* ── Scanning toast ── */}
        {refreshing && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0d1117] border border-indigo-500/40 shadow-2xl shadow-indigo-500/20 card-glow">
            <div className="w-4 h-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin shrink-0" />
            <div>
              <div className="text-xs font-semibold text-white">Scanning hunters...</div>
              <div className="text-[10px] text-slate-500">Fetching tweets & extracting alpha</div>
            </div>
          </div>
        )}
      </main>

      {/* ── Project detail modal ── */}
      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] mt-12 py-6 text-center">
        <p className="text-xs text-slate-700">
          Alpha Hunter — powered by{' '}
          <span className="text-indigo-500/60">twitterapi.io</span> ·{' '}
          <span className="text-violet-500/60">Claude AI</span> ·{' '}
          <span className="text-emerald-500/60">Supabase</span>
        </p>
      </footer>
    </div>
  );
}
