import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service — AlphaScan',
};

const sections = [
  {
    title: 'What AlphaScan Is',
    body: 'AlphaScan is an informational tool that monitors public posts from crypto Twitter/X accounts and uses AI to surface early-stage projects. It is a signal aggregator, not a financial platform. Nothing on this site constitutes an offer, recommendation, or solicitation to buy or sell any asset.',
  },
  {
    title: 'No Financial Advice',
    body: 'Nothing on AlphaScan is investment or financial advice. The projects, signals, and scores shown are generated automatically from public social media data and AI analysis. They do not reflect the views or recommendations of AlphaScan or its operators.',
  },
  {
    title: 'No Liability',
    body: 'AlphaScan and its operators are not responsible for any financial losses, missed opportunities, or damages arising from the use of this platform. You use this service entirely at your own risk. Crypto assets are highly volatile and speculative.',
  },
  {
    title: 'Data Accuracy',
    body: 'Data on AlphaScan is extracted automatically using AI from public tweets. It may contain errors, hallucinations, outdated information, or misidentified projects. We do not verify the accuracy of any extracted data. Always confirm details independently before acting on any signal.',
  },
  {
    title: 'DYOR — Do Your Own Research',
    body: 'You are solely responsible for any research, decisions, and actions you take based on information found on AlphaScan. Never invest money you cannot afford to lose. Always conduct thorough independent research before engaging with any project.',
  },
  {
    title: 'Data Sources',
    body: 'AlphaScan pulls from publicly available posts on Twitter/X via the TwitterAPI.io service. We do not store or republish private data. All source tweets are attributed and linked where available. AlphaScan is not affiliated with Twitter/X or any of the hunters tracked.',
  },
  {
    title: 'Changes to Terms',
    body: 'We may update these terms at any time without prior notice. Continued use of AlphaScan after any changes constitutes your acceptance of the updated terms. The "Last updated" date at the top of this page reflects when changes were last made.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#1a1a1a] bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="AlphaScan" width={36} height={36} />
            <span className="font-mono text-sm font-bold tracking-widest text-white">ALPHASCAN</span>
          </Link>
          <Link
            href="/feed"
            className="font-mono text-xs text-[#94a3b8] tracking-widest hover:text-white transition-colors"
          >
            ← BACK TO FEED
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <h1 className="font-mono text-2xl font-bold tracking-tight text-white mb-2">
            Terms of Service
          </h1>
          <p className="font-mono text-[11px] text-[#475569] tracking-widest">
            LAST UPDATED: MARCH 2026
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map(({ title, body }) => (
            <div key={title} className="border-l-2 border-[#1f1f1f] pl-5">
              <h2 className="font-mono text-sm font-bold text-white tracking-wide mb-2">
                {title}
              </h2>
              <p className="text-[14px] text-[#94a3b8] leading-[1.7]">
                {body}
              </p>
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] mt-16 py-6">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-[11px] text-[#475569] leading-relaxed">
            AlphaScan is for informational purposes only. Nothing here is financial advice. Always do your own research (DYOR). We are not responsible for any financial decisions made based on this data.
          </p>
        </div>
      </footer>

    </div>
  );
}
