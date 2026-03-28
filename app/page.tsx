import Link from 'next/link';

const features = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
      </svg>
    ),
    label: '33 Alpha Hunters Tracked',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    label: 'AI-Powered Extraction',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Updated Daily',
  },
];

export default function LandingPage() {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#080b14]">

      {/* ── Animated background orbs ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* dot-grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:28px_28px]" />

        {/* orb 1 — indigo, top-left */}
        <div className="landing-orb absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />

        {/* orb 2 — violet, bottom-right */}
        <div className="landing-orb-reverse absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-violet-700/15 blur-[110px]" />

        {/* orb 3 — blue, center-right */}
        <div className="landing-orb-slow absolute top-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-blue-600/10 blur-[90px]" />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl">

        {/* Brand pill */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
          </span>
          Alpha Hunter
        </div>

        {/* Headline */}
        <h1 className="mb-4 text-5xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl">
          Find Crypto Alpha{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
            Before Everyone Else
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mb-10 max-w-md text-base text-slate-400 leading-relaxed">
          We monitor 33 of crypto&apos;s top alpha hunters on Twitter and use AI to surface early project signals for your own research.
        </p>

        {/* Feature pills */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
          {features.map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-slate-400"
            >
              <span className="text-indigo-400">{icon}</span>
              {label}
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/feed"
          className="group relative inline-flex items-center gap-2.5 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
        >
          View Alpha Feed
          <svg
            className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>


      </div>
    </div>
  );
}
