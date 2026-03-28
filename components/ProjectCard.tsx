'use client';

import React from 'react';
import { Project } from '@/lib/supabase';

const CHAIN_LABEL: Record<string, string> = {
  solana: 'SOL', eth: 'ETH', base: 'BASE', arbitrum: 'ARB', bnb: 'BNB',
  polygon: 'MATIC', avalanche: 'AVAX', sui: 'SUI', aptos: 'APT', ton: 'TON',
  blast: 'BLAST', scroll: 'SCROLL', zksync: 'ZK', linea: 'LINEA', mantle: 'MNT',
  berachain: 'BERA', sonic: 'SONIC', megaeth: 'METH', abstract: 'ABS', hyperliquid: 'HYPE',
};

const TYPE_LABEL: Record<string, string> = {
  airdrop: 'AIRDROP', 'new token': 'TOKEN', nft: 'NFT', defi: 'DEFI', other: 'OTHER',
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
  const idTag   = project.id.replace(/-/g, '').slice(0, 6).toUpperCase();
  const chainKey = project.chain?.toLowerCase().trim() ?? '';
  const chainLabel = isEmpty(chainKey) ? null : (CHAIN_LABEL[chainKey] ?? chainKey.toUpperCase());
  const typeKey  = project.alpha_type?.toLowerCase().trim() ?? '';
  const typeLabel = isEmpty(typeKey) ? null : (TYPE_LABEL[typeKey] ?? typeKey.toUpperCase());

  // Hype bar: uniform indigo, width proportional to hype_level
  const hypeWidth = project.hype_level
    ? `${Math.min(100, Math.max(0, (project.hype_level / 10) * 100))}%`
    : '0%';

  // Left accent border color by alpha type
  const TYPE_ACCENT: Record<string, string> = {
    'new token': '#6366f1',
    nft:         '#8b5cf6',
    airdrop:     '#22c55e',
    defi:        '#3b82f6',
    other:       '#64748b',
  };
  const accentColor = TYPE_ACCENT[typeKey] ?? '#64748b';

  const isNew = (Date.now() - new Date(project.first_spotted).getTime()) < 6 * 3_600_000;

  return (
    <article
      onClick={onClick}
      className="card-enter group relative flex flex-col bg-[#111] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all duration-200 cursor-pointer"
      style={{ animationDelay: `${rank * 30}ms`, borderLeft: `3px solid ${accentColor}` }}
    >
      {/* Body */}
      <div className="flex flex-col gap-3 p-5 flex-1">

        {/* Top row: ID tag + badges */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-[#475569] tracking-wider">
              [ {idTag} ]
            </span>
            {isNew && (
              <span className="font-mono text-[10px] text-[#6366f1] tracking-widest">NEW</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {chainLabel && (
              <span className="font-mono text-[10px] text-[#94a3b8] tracking-wider">{chainLabel}</span>
            )}
            {typeLabel && (
              <span className="font-mono text-[10px] text-[#94a3b8] tracking-wider">{typeLabel}</span>
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
      <div className="flex items-center justify-between px-5 py-3 border-t border-[#1a1a1a]">
        <span
          className="font-mono text-[10px] text-[#94a3b8] tracking-wider"
          title={formatFull(project.first_spotted)}
        >
          {formatRelative(project.first_spotted)}
        </span>
        <span className="font-mono text-[10px] text-[#6366f1] tracking-wider group-hover:text-[#818cf8] transition-colors">
          VIEW ↗
        </span>
      </div>

      {/* Hype bar — absolute bottom line, always indigo */}
      <div
        className="absolute bottom-0 left-0 h-[2px] transition-all duration-700"
        style={{ width: hypeWidth, backgroundColor: '#6366f1', opacity: 0.6 }}
      />
    </article>
  );
}
