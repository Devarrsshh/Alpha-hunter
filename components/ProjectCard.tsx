'use client';

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

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function formatFull(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
}

function SpottedBadge({ iso }: { iso: string }) {
  const ageHours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (ageHours < 6) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-indigo-500 text-white shadow shadow-indigo-500/40 animate-pulse">
        NEW
      </span>
    );
  }
  if (ageHours < 24) {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
        TODAY
      </span>
    );
  }
  return null;
}

function ScoreBar({ score }: { score: number }) {
  const clamped = Math.min(100, Math.max(0, score));
  const color =
    clamped >= 70 ? 'from-emerald-500 to-green-400' :
    clamped >= 40 ? 'from-amber-500 to-yellow-400' :
                    'from-red-500 to-orange-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-slate-600 w-7 text-right uppercase tracking-wide">hype</span>
    </div>
  );
}

const HIDDEN_VALUES = new Set(['unknown', 'other', '', 'none', 'n/a', 'null']);

function isEmpty(val: string | null | undefined) {
  return !val || HIDDEN_VALUES.has(val.toLowerCase().trim());
}

export default function ProjectCard({ project, rank, onClick }: { project: Project; rank: number; onClick: () => void }) {
  const chainKey  = project.chain?.toLowerCase().trim() ?? '';
  const chain     = isEmpty(chainKey) ? null : (CHAIN_STYLES[chainKey] ?? null);

  const alphaKey  = project.alpha_type?.toLowerCase().trim() ?? '';
  const alphaIcon = isEmpty(alphaKey) ? null : (ALPHA_TYPE_ICONS[alphaKey] ?? null);

  const isTop3 = rank <= 3;

  return (
    <article
      onClick={onClick}
      className={[
        'card-enter group relative rounded-2xl border p-5 transition-all duration-300 cursor-pointer select-none',
        'hover:-translate-y-0.5',
        isTop3
          ? 'border-indigo-500/50 bg-gradient-to-br from-[#0f1629] to-[#0d1117] shadow-lg shadow-indigo-500/10 card-glow hover:border-indigo-400/80 hover:shadow-[0_0_40px_rgba(99,102,241,0.25)]'
          : 'border-white/[0.07] bg-[#0d1117] hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]',
      ].join(' ')}
      style={{ animationDelay: `${rank * 40}ms` }}
    >
      {/* Expand hint — appears on hover */}
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <svg className="w-3.5 h-3.5 text-indigo-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>

      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Rank */}
          <span className={[
            'shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono',
            rank === 1 ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40' :
            rank === 2 ? 'bg-slate-400/20 text-slate-300 ring-1 ring-slate-400/40' :
            rank === 3 ? 'bg-orange-400/20 text-orange-300 ring-1 ring-orange-400/40' :
                         'bg-white/5 text-slate-500',
          ].join(' ')}>
            {rank}
          </span>
          {/* Alpha type icon */}
          {alphaIcon && <span className="text-lg leading-none" title={project.alpha_type}>{alphaIcon}</span>}
          {/* Project name */}
          <h3 className="text-base font-semibold text-white truncate leading-tight">{project.name}</h3>
        </div>

        {/* Hype level */}
        {project.hype_level != null && (
          <div className="shrink-0 text-right">
            <div className={[
              'text-xl font-bold font-mono leading-none',
              project.hype_level >= 8 ? 'text-orange-400' :
              project.hype_level >= 5 ? 'text-yellow-400' : 'text-slate-500',
            ].join(' ')}>
              {project.hype_level >= 8 ? '🔥' : project.hype_level >= 5 ? '⚡' : ''}
              {project.hype_level}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">hype</div>
          </div>
        )}
      </div>

      {/* Badges — only render when real data exists */}
      {(chain || alphaIcon || project.is_shill) && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {chain && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${chain.class}`}>
              {chain.label}
            </span>
          )}
          {alphaIcon && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-white/[0.08] bg-white/[0.04] text-slate-400">
              {alphaIcon} {project.alpha_type}
            </span>
          )}
          {project.is_shill && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border border-slate-600/40 bg-slate-700/20 text-slate-500">
              Promoted
            </span>
          )}
        </div>
      )}

      {/* Summary */}
      <p className="text-sm text-slate-400 leading-relaxed mb-3 line-clamp-2">{project.summary}</p>

      {/* Hype bar */}
      <div className="mb-4">
        <ScoreBar score={project.score} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          {/* Relative date with tooltip */}
          <span
            className="flex items-center gap-1 cursor-default"
            title={formatFull(project.first_spotted)}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatRelative(project.first_spotted)}
          </span>
          <SpottedBadge iso={project.first_spotted} />
        </div>

        {/* Tweet links */}
        {project.tweet_links?.length > 0 && (
          <div className="flex items-center gap-1.5">
            {project.tweet_links.slice(0, 3).map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.07] hover:border-white/[0.2] transition-colors text-slate-400 hover:text-white"
                title="View source tweet"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                #{i + 1}
              </a>
            ))}
            {project.tweet_links.length > 3 && (
              <span className="text-slate-600">+{project.tweet_links.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Hunters who mentioned (if more than 1) */}
      {project.mentioned_by?.length > 1 && (
        <div className="mt-3 pt-3 border-t border-white/[0.05] flex flex-wrap gap-1">
          {project.mentioned_by.slice(0, 5).map((handle) => (
            <span key={handle} className="text-[10px] text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono">
              @{handle}
            </span>
          ))}
          {project.mentioned_by.length > 5 && (
            <span className="text-[10px] text-slate-600">+{project.mentioned_by.length - 5} more</span>
          )}
        </div>
      )}
    </article>
  );
}
