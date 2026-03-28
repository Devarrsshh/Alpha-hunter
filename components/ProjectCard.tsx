'use client';

import React from 'react';
import { Project } from '@/lib/supabase';

const CHAIN_LABEL: Record<string, string> = {
  solana: 'SOL', eth: 'ETH', base: 'BASE', arbitrum: 'ARB', bnb: 'BNB',
  polygon: 'MATIC', avalanche: 'AVAX', sui: 'SUI', aptos: 'APT', ton: 'TON',
  blast: 'BLAST', scroll: 'SCROLL', zksync: 'ZK', linea: 'LINEA', mantle: 'MNT',
  berachain: 'BERA', sonic: 'SONIC', megaeth: 'METH', abstract: 'ABS', hyperliquid: 'HYPE',
};

// Subtle pill bg + text per chain family
const CHAIN_COLOR: Record<string, { bg: string; text: string }> = {
  solana:      { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc' },
  eth:         { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8' },
  base:        { bg: 'rgba(59,130,246,0.12)',  text: '#93c5fd' },
  arbitrum:    { bg: 'rgba(14,165,233,0.12)',  text: '#7dd3fc' },
  bnb:         { bg: 'rgba(234,179,8,0.12)',   text: '#fde047' },
  polygon:     { bg: 'rgba(217,70,239,0.12)',  text: '#e879f9' },
  avalanche:   { bg: 'rgba(239,68,68,0.12)',   text: '#f87171' },
  sui:         { bg: 'rgba(20,184,166,0.12)',  text: '#5eead4' },
  aptos:       { bg: 'rgba(34,197,94,0.12)',   text: '#86efac' },
  ton:         { bg: 'rgba(6,182,212,0.12)',   text: '#67e8f9' },
  blast:       { bg: 'rgba(163,230,53,0.12)',  text: '#bef264' },
  scroll:      { bg: 'rgba(249,115,22,0.12)',  text: '#fdba74' },
  zksync:      { bg: 'rgba(99,102,241,0.12)',  text: '#a5b4fc' },
  linea:       { bg: 'rgba(148,163,184,0.1)',  text: '#cbd5e1' },
  mantle:      { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
  berachain:   { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
  sonic:       { bg: 'rgba(34,197,94,0.12)',   text: '#4ade80' },
  megaeth:     { bg: 'rgba(236,72,153,0.12)',  text: '#f9a8d4' },
  abstract:    { bg: 'rgba(161,161,170,0.1)',  text: '#a1a1aa' },
  hyperliquid: { bg: 'rgba(34,211,238,0.12)',  text: '#67e8f9' },
};

const TYPE_LABEL: Record<string, string> = {
  airdrop: 'AIRDROP', 'new token': 'TOKEN', nft: 'NFT', defi: 'DEFI', other: 'OTHER',
};

const TYPE_ACCENT: Record<string, string> = {
  'new token': '#6366f1',
  nft:         '#8b5cf6',
  airdrop:     '#22c55e',
  defi:        '#3b82f6',
  other:       '#64748b',
};

const HIDDEN = new Set(['unknown', 'other', '', 'none', 'n/a', 'null']);
const isEmpty = (v?: string | null) => !v || HIDDEN.has(v.toLowerCase().trim());

function formatRelative(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return '1d ago';
  return `${days}d ago`;
}

function formatFull(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

export default function ProjectCard({
  project,
  rank,
  onClick,
}: {
  project: Project;
  rank: number;
  onClick: () => void;
}) {
  const idTag      = project.id.replace(/-/g, '').slice(0, 6).toUpperCase();
  const chainKey   = project.chain?.toLowerCase().trim() ?? '';
  const chainLabel = isEmpty(chainKey) ? null : (CHAIN_LABEL[chainKey] ?? chainKey.toUpperCase());
  const chainColor = CHAIN_COLOR[chainKey] ?? { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8' };
  const typeKey    = project.alpha_type?.toLowerCase().trim() ?? '';
  const typeLabel  = isEmpty(typeKey) ? null : (TYPE_LABEL[typeKey] ?? typeKey.toUpperCase());
  const accentColor = TYPE_ACCENT[typeKey] ?? '#64748b';

  // Hype bar
  const hypeWidth = project.hype_level
    ? `${Math.min(100, Math.max(0, (project.hype_level / 10) * 100))}%`
    : '0%';

  // Hype display
  const hype = project.hype_level ?? 0;
  const hypeDisplay = hype >= 8
    ? { icon: '🔥', color: '#fb923c' }
    : hype >= 5
    ? { icon: '⚡', color: '#fbbf24' }
    : { icon: '',   color: '#64748b' };

  // Age badges
  const ageMs   = Date.now() - new Date(project.first_spotted).getTime();
  const ageHours = ageMs / 3_600_000;
  const ageBadge = ageHours < 6
    ? { label: 'NEW',   cls: 'text-[#22c55e] border-[#22c55e]/30 bg-[#22c55e]/10' }
    : ageHours < 24
    ? { label: 'TODAY', cls: 'text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10' }
    : null;

  // Tweet source links (up to 3)
  const tweetLinks = (project.tweet_links ?? []).slice(0, 3);

  return (
    <article
      onClick={onClick}
      className="card-enter group relative flex flex-col bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all duration-200 cursor-pointer overflow-hidden"
      style={{ animationDelay: `${rank * 30}ms`, borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Body */}
      <div className="flex flex-col gap-3 p-5 flex-1">

        {/* Top row: ID + chain pill + type + hype score */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] text-[#475569] tracking-wider shrink-0">
            [ {idTag} ]
          </span>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {chainLabel && (
              <span
                className="font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded-sm border border-transparent"
                style={{ backgroundColor: chainColor.bg, color: chainColor.text, borderColor: `${chainColor.text}22` }}
              >
                {chainLabel}
              </span>
            )}
            {typeLabel && (
              <span className="font-mono text-[10px] text-[#94a3b8] tracking-wider">{typeLabel}</span>
            )}
            {hype > 0 && (
              <span
                className="font-mono text-[11px] font-bold tracking-wide"
                style={{ color: hypeDisplay.color }}
              >
                {hypeDisplay.icon}{hypeDisplay.icon ? ' ' : ''}{hype}
              </span>
            )}
          </div>
        </div>

        {/* Project name */}
        <h3 className="text-[20px] font-semibold text-white leading-snug tracking-tight">
          {project.name}
        </h3>

        {/* Summary — 2 lines */}
        <p
          className="text-[14px] text-[#94a3b8] leading-[1.6]"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}
        >
          {project.summary}
        </p>

        {/* Hunters (if multiple) */}
        {project.mentioned_by?.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {project.mentioned_by.slice(0, 4).map((h) => (
              <span key={h} className="font-mono text-[10px] text-[#818cf8] tracking-wider">
                @{h}
              </span>
            ))}
            {project.mentioned_by.length > 4 && (
              <span className="font-mono text-[10px] text-[#64748b]">
                +{project.mentioned_by.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#1a1a1a]">
        {/* Left: timestamp + age badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="font-mono text-[10px] text-[#94a3b8] tracking-wider"
            title={formatFull(project.first_spotted)}
          >
            {formatRelative(project.first_spotted)}
          </span>
          {ageBadge && (
            <span className={`font-mono text-[9px] font-bold tracking-widest px-1 py-0.5 border rounded-sm ${ageBadge.cls}`}>
              {ageBadge.label}
            </span>
          )}
        </div>

        {/* Right: tweet source links */}
        <div className="flex items-center gap-2">
          {tweetLinks.length > 0 ? (
            tweetLinks.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-mono text-[10px] text-[#6366f1] tracking-wider hover:text-[#818cf8] transition-colors"
              >
                SRC #{i + 1} ↗
              </a>
            ))
          ) : (
            <span className="font-mono text-[10px] text-[#6366f1] tracking-wider group-hover:text-[#818cf8] transition-colors">
              VIEW ↗
            </span>
          )}
        </div>
      </div>

      {/* Hype bar — 6px absolute bottom */}
      <div
        className="absolute bottom-0 left-0 h-[6px] transition-all duration-700"
        style={{ width: hypeWidth, backgroundColor: '#6366f1', opacity: 0.5 }}
      />
    </article>
  );
}
