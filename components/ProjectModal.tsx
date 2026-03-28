'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { Project } from '@/lib/supabase';

const CHAIN_STYLES: Record<string, { label: string; class: string }> = {
  solana:      { label: 'Solana',      class: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  eth:         { label: 'Ethereum',    class: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  base:        { label: 'Base',        class: 'bg-blue-900/40 text-blue-200 border-blue-800/60' },
  arbitrum:    { label: 'Arbitrum',    class: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  bnb:         { label: 'BNB',         class: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  polygon:     { label: 'Polygon',     class: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40' },
  avalanche:   { label: 'Avalanche',   class: 'bg-red-500/20 text-red-300 border-red-500/40' },
  sui:         { label: 'Sui',         class: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
  aptos:       { label: 'Aptos',       class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  ton:         { label: 'TON',         class: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
  blast:       { label: 'Blast',       class: 'bg-lime-500/20 text-lime-300 border-lime-500/40' },
  scroll:      { label: 'Scroll',      class: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  zksync:      { label: 'zkSync',      class: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  linea:       { label: 'Linea',       class: 'bg-slate-400/20 text-slate-300 border-slate-400/40' },
  mantle:      { label: 'Mantle',      class: 'bg-gray-500/20 text-gray-300 border-gray-500/40' },
  berachain:   { label: 'Berachain',   class: 'bg-orange-600/20 text-orange-300 border-orange-600/40' },
  sonic:       { label: 'Sonic',       class: 'bg-green-500/20 text-green-300 border-green-500/40' },
  megaeth:     { label: 'MegaETH',     class: 'bg-pink-500/20 text-pink-300 border-pink-500/40' },
  abstract:    { label: 'Abstract',    class: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40' },
  hyperliquid: { label: 'Hyperliquid', class: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40' },
};

const ALPHA_TYPE_ICONS: Record<string, string> = {
  airdrop:     '🪂',
  'new token': '🪙',
  nft:         '🖼️',
  defi:        '⚡',
};

const HIDDEN = new Set(['unknown', 'other', '', 'none', 'n/a', 'null']);
const isEmpty = (v?: string | null) => !v || HIDDEN.has(v.toLowerCase().trim());

function formatFull(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

function formatRelative(iso: string) {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function HypeBar({ level }: { level: number }) {
  const clamped = Math.min(10, Math.max(1, Math.round(level)));
  const barColor = clamped >= 8 ? '#22c55e' : clamped >= 5 ? '#eab308' : '#64748b';
  const textColor = clamped >= 8 ? '#22c55e' : clamped >= 5 ? '#eab308' : '#64748b';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold font-mono leading-none tabular-nums" style={{ color: textColor }}>
          {clamped}
        </span>
        <span className="text-sm font-mono text-slate-600">/10</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${clamped * 10}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
      className={[
        'shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-200',
        copied
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
          : 'bg-white/[0.04] hover:bg-white/[0.09] text-slate-500 hover:text-slate-300 border border-white/[0.07] hover:border-white/[0.15]',
      ].join(' ')}
    >
      {copied ? (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </>
      )}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-2.5">{title}</div>
      {children}
    </div>
  );
}

export default function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    // Trigger enter animation on next frame
    const raf = requestAnimationFrame(() => setVisible(true));
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  const chainKey  = project.chain?.toLowerCase().trim() ?? '';
  const chain     = isEmpty(chainKey) ? null : (CHAIN_STYLES[chainKey] ?? null);
  const alphaKey  = project.alpha_type?.toLowerCase().trim() ?? '';
  const alphaIcon = isEmpty(alphaKey) ? null : (ALPHA_TYPE_ICONS[alphaKey] ?? null);

  const tweetEntries = (project.tweet_links ?? []).map((url) => {
    const match = url.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status/);
    return { url, hunter: match?.[1] ?? null };
  });

  const scoreColor =
    project.score >= 70 ? 'text-emerald-400' :
    project.score >= 40 ? 'text-amber-400' : 'text-red-400';

  const scoreBarColor =
    project.score >= 70 ? 'from-emerald-500 to-green-400' :
    project.score >= 40 ? 'from-amber-500 to-yellow-400' : 'from-red-500 to-orange-400';

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      className={[
        'fixed inset-0 z-50 flex items-center justify-end transition-all duration-300',
        visible ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/0 backdrop-blur-none',
      ].join(' ')}
    >
      {/* Drawer */}
      <div
        className={[
          'relative h-full w-full max-w-lg bg-[#0f0f0f] border-l border-[#1a1a1a] shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          visible ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-white/[0.06] shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2.5">
              {chain && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${chain.class}`}>
                  {chain.label}
                </span>
              )}
              {alphaIcon && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-white/[0.08] bg-white/[0.04] text-slate-400">
                  {alphaIcon} {project.alpha_type}
                </span>
              )}
              {project.is_shill && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border border-slate-600/40 bg-slate-700/20 text-slate-500">
                  Promoted
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white leading-tight tracking-tight">{project.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 mt-0.5 p-2 rounded-lg hover:bg-white/[0.08] text-slate-500 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Score + hype row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-1.5">Alpha Score</div>
              <div className={`text-3xl font-bold font-mono leading-none ${scoreColor}`}>
                {Math.round(project.score)}
                <span className="text-base text-slate-600 font-normal">/100</span>
              </div>
              <div className="mt-2 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${scoreBarColor} transition-all duration-700`}
                  style={{ width: `${Math.round(project.score)}%` }}
                />
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <div className="text-[10px] uppercase tracking-widest text-slate-600 mb-2.5">Hype Level</div>
              {project.hype_level ? (
                <HypeBar level={project.hype_level} />
              ) : (
                <span className="text-xs text-slate-600">—</span>
              )}
            </div>
          </div>

          {/* Buzz */}
          {(project.buzz_count ?? 0) > 0 ? (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="font-mono text-xs text-slate-300">
                <span className={[
                  'font-bold',
                  project.buzz_count >= 50 ? 'text-emerald-400' :
                  project.buzz_count >= 20 ? 'text-amber-400'   :
                  project.buzz_count >=  5 ? 'text-slate-300'   : 'text-slate-500',
                ].join(' ')}>
                  {project.buzz_count}
                </span>
                <span className="text-slate-500"> mentions on X in last 48hrs</span>
              </span>
              {project.buzz_count < 5 && (
                <span className="ml-auto font-mono text-[10px] text-slate-600 border border-slate-700/50 px-1.5 py-0.5 rounded">
                  LOW BUZZ
                </span>
              )}
            </div>
          ) : null}

          {/* Summary */}
          <Section title="Summary">
            <p className="text-sm text-slate-300 leading-relaxed">{project.summary}</p>
          </Section>

          {/* First spotted */}
          <Section title="First Spotted">
            <div className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium text-slate-300">{formatRelative(project.first_spotted)}</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500 text-xs">{formatFull(project.first_spotted)}</span>
            </div>
          </Section>

          {/* Project links */}
          {(!isEmpty(project.project_twitter) || !isEmpty(project.project_website)) && (
            <Section title="Project Links">
              <div className="flex flex-col gap-2">
                {!isEmpty(project.project_twitter) && (
                  <a
                    href={`https://twitter.com/${project.project_twitter.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-indigo-500/40 hover:bg-indigo-500/[0.04] transition-all duration-200 group"
                  >
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    <span className="text-sm text-slate-400 group-hover:text-white transition-colors font-mono">
                      {project.project_twitter.startsWith('@') ? project.project_twitter : `@${project.project_twitter}`}
                    </span>
                    <svg className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
                {!isEmpty(project.project_website) && (
                  <a
                    href={project.project_website.startsWith('http') ? project.project_website : `https://${project.project_website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-indigo-500/40 hover:bg-indigo-500/[0.04] transition-all duration-200 group"
                  >
                    <svg className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span className="text-sm text-slate-400 group-hover:text-white transition-colors truncate">
                      {project.project_website.replace(/^https?:\/\//, '')}
                    </span>
                    <svg className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            </Section>
          )}

          {/* Contract address */}
          {!isEmpty(project.contract_address) && (
            <Section title="Contract Address">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <span className="text-xs font-mono text-slate-400 truncate flex-1 select-all">{project.contract_address}</span>
                <CopyButton text={project.contract_address} />
              </div>
            </Section>
          )}

          {/* Hunters */}
          {(project.mentioned_by ?? []).length > 0 && (
            <Section title={`Spotted by ${project.mentioned_by.length} hunter${project.mentioned_by.length === 1 ? '' : 's'}`}>
              <div className="flex flex-wrap gap-1.5">
                {project.mentioned_by.map((handle) => (
                  <a
                    key={handle}
                    href={`https://twitter.com/${handle.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] font-mono text-indigo-400/80 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/20 hover:border-indigo-500/50 hover:text-indigo-300 transition-all duration-150"
                  >
                    <span className="text-indigo-600">@</span>{handle.replace(/^@/, '')}
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Source tweets */}
          {tweetEntries.length > 0 && (
            <Section title={`${tweetEntries.length} Source Tweet${tweetEntries.length === 1 ? '' : 's'}`}>
              <div className="flex flex-col gap-2">
                {tweetEntries.map(({ url, hunter }, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.18] hover:bg-white/[0.05] transition-all duration-150 group"
                  >
                    <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-slate-500 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </div>
                    <span className="text-sm font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
                      {hunter ? `@${hunter}` : `Tweet #${i + 1}`}
                    </span>
                    <svg className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </Section>
          )}

          {/* Bottom padding so last section doesn't sit flush against edge */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
