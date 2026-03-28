'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Project } from '@/lib/supabase';
import ProjectCard from './ProjectCard';
import ProjectModal from './ProjectModal';

const TYPE_FILTERS = [
  { key: 'all',       label: 'ALL' },
  { key: 'airdrop',   label: 'AIRDROP' },
  { key: 'new token', label: 'TOKEN' },
  { key: 'defi',      label: 'DEFI' },
  { key: 'nft',       label: 'NFT' },
  { key: 'other',     label: 'OTHER' },
];

const COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

function formatRelative(date: Date): string {
  const diff  = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatCooldown(ms: number): string {
  const totalMins = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function AlphaFeed() {
  const [projects,        setProjects]        = useState<Project[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [refreshing,      setRefreshing]      = useState(false);
  const [autoScanning,    setAutoScanning]    = useState(false);
  const [filterType,      setFilterType]      = useState('all');
  const [search,          setSearch]          = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [lastScan,        setLastScan]        = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const autoScanTriggered = useRef(false);

  // Re-render every minute to keep countdown accurate
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Fetch last scan time from DB (shared across all users)
  const fetchLastScanTime = useCallback(async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'last_scan_at')
      .maybeSingle();
    if (error) {
      console.error('[LAST SCAN] Failed to read from settings table:', error.message, error.code);
      return;
    }
    if (data?.value) {
      const parsed = new Date(data.value);
      console.log('[LAST SCAN] Loaded from DB:', data.value);
      setLastScan(parsed);
    } else {
      console.log('[LAST SCAN] No last_scan_at row found in settings table yet.');
    }
  }, []);

  const fetchProjects = useCallback(async (): Promise<Project[]> => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('hype_level',    { ascending: false, nullsFirst: false })
      .order('mention_count', { ascending: false })
      .order('first_spotted', { ascending: false });
    if (!error && data) {
      setProjects(data as Project[]);
      return data as Project[];
    }
    return [];
  }, []);

  const handleScan = useCallback(async () => {
    setRefreshing(true);
    try {
      const res  = await fetch('/api/fetch-tweets');
      const json = await res.json();
      if (json.success) {
        const now = new Date();
        setLastScan(now);
        await fetchProjects();
      } else {
        console.error('Scan error:', json.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
      setAutoScanning(false);
    }
  }, [fetchProjects]);

  useEffect(() => {
    (async () => {
      await fetchLastScanTime();
      const data = await fetchProjects();
      setLoading(false);
      if (data.length === 0 && !autoScanTriggered.current) {
        autoScanTriggered.current = true;
        setAutoScanning(true);
        await handleScan();
      }
    })();
  }, [fetchLastScanTime, fetchProjects, handleScan]);

  // Cooldown
  const cooldownRemaining = lastScan
    ? Math.max(0, COOLDOWN_MS - (Date.now() - lastScan.getTime()))
    : 0;
  const isCoolingDown = cooldownRemaining > 0;

  const filtered = projects.filter((p) => {
    if ((p.hype_level ?? 0) <= 3) return false;
    const matchType   = filterType === 'all' || p.alpha_type?.toLowerCase() === filterType;
    const matchSearch = !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.summary?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const visibleCount = projects.filter((p) => (p.hype_level ?? 0) >= 4).length;
  const chainCount   = new Set(projects.map((p) => p.chain?.toLowerCase()).filter(Boolean)).size;
  const topHype      = projects.reduce((max, p) => Math.max(max, p.hype_level ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-30 border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14 gap-6">

            {/* Logo */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[#6366f1] font-mono text-sm font-bold">▲</span>
              <span className="font-mono text-sm font-bold tracking-widest text-white">ALPHA_HUNTER</span>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-sm hidden sm:block">
              <div className="flex items-center gap-2 px-3 py-1.5 border border-[#1f1f1f] bg-[#111] focus-within:border-[#6366f1]/50 transition-colors">
                <span className="font-mono text-[#6366f1] text-sm shrink-0">&gt;</span>
                <input
                  type="text"
                  placeholder="Query alpha signals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-sm font-mono text-slate-300 placeholder-[#475569] focus:outline-none"
                />
                {!search && <span className="font-mono text-sm text-[#6366f1]/70 cursor-blink shrink-0">_</span>}
              </div>
            </div>

            {/* Run Scan */}
            <button
              onClick={handleScan}
              disabled={refreshing || isCoolingDown}
              className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs tracking-widest border border-[#2a2a2a] text-slate-400 hover:border-[#6366f1]/60 hover:text-[#6366f1] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {refreshing ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse" />
                  SCANNING...
                </>
              ) : isCoolingDown ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full border border-current" />
                  NEXT SCAN IN {formatCooldown(cooldownRemaining)}
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full border border-current" />
                  RUN SCAN
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Stats bar ── */}
      <div className="border-b border-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-wrap gap-10">
            <div>
              <div className="font-mono text-3xl font-bold text-white tabular-nums">{visibleCount}</div>
              <div className="font-mono text-[10px] text-[#94a3b8] uppercase tracking-widest mt-1">PROJECTS</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-white tabular-nums">33</div>
              <div className="font-mono text-[10px] text-[#94a3b8] uppercase tracking-widest mt-1">HUNTERS</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold text-white tabular-nums">{chainCount}</div>
              <div className="font-mono text-[10px] text-[#94a3b8] uppercase tracking-widest mt-1">CHAINS</div>
            </div>
            <div>
              <div
                className="font-mono text-3xl font-bold tabular-nums"
                style={{ color: topHype >= 8 ? '#22c55e' : topHype >= 5 ? '#eab308' : '#94a3b8' }}
              >
                {topHype > 0 ? `${topHype}/10` : '—'}
              </div>
              <div className="font-mono text-[10px] text-[#94a3b8] uppercase tracking-widest mt-1">TOP HYPE</div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Filters + count ── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-1">
            {TYPE_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={[
                  'px-3 py-1 font-mono text-xs tracking-widest transition-all',
                  filterType === key
                    ? 'text-[#6366f1] border-b border-[#6366f1]'
                    : 'text-[#94a3b8] hover:text-white',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="font-mono text-xs text-[#94a3b8]">
            {filtered.length}/{visibleCount} RESULTS
          </span>
        </div>

        {/* ── Mobile search ── */}
        <div className="block sm:hidden mb-6">
          <div className="flex items-center gap-2 px-3 py-2 border border-[#1f1f1f] bg-[#111]">
            <span className="font-mono text-[#6366f1] text-sm">&gt;</span>
            <input
              type="text"
              placeholder="Query alpha signals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm font-mono text-slate-300 placeholder-[#475569] focus:outline-none"
            />
            {!search && <span className="font-mono text-sm text-[#6366f1]/70 cursor-blink shrink-0">_</span>}
          </div>
        </div>

        {/* ── Feed ── */}
        {loading || autoScanning ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="font-mono text-sm text-[#6366f1] tracking-widest">
              {autoScanning ? '> FETCHING ALPHA FROM 33 HUNTERS...' : '> LOADING SIGNALS...'}
            </div>
            {autoScanning && (
              <div className="font-mono text-xs text-[#94a3b8] tracking-wider">
                SCANNING TWITTER · EXTRACTING WITH AI · EST. 30s
              </div>
            )}
            <div className="flex gap-1 mt-2">
              {[0,1,2,3,4].map((i) => (
                <div
                  key={i}
                  className="w-1 h-4 bg-[#6366f1]/40 animate-pulse"
                  style={{ animationDelay: `${i * 120}ms` }}
                />
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-2">
            <div className="font-mono text-sm text-[#94a3b8] tracking-widest">// NO SIGNALS FOUND</div>
            <div className="font-mono text-xs text-[#64748b]">ADJUST FILTERS OR QUERY</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
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
        {refreshing && !autoScanning && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[#111] border border-[#6366f1]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1] animate-pulse shrink-0" />
            <div>
              <div className="font-mono text-xs text-white tracking-widest">SCANNING HUNTERS...</div>
              <div className="font-mono text-[10px] text-[#94a3b8] mt-0.5">FETCHING · EXTRACTING · UPSERTING</div>
            </div>
          </div>
        )}
      </main>

      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}

      <footer className="border-t border-[#1a1a1a] mt-16 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <span className="font-mono text-[10px] text-[#475569] tracking-widest">ALPHA_HUNTER v1.0</span>
          <span className="font-mono text-[10px] text-[#475569] tracking-widest">
            TWITTERAPI.IO · CLAUDE AI · SUPABASE
          </span>
        </div>
      </footer>
    </div>
  );
}
