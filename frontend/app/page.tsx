import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-[#100820] via-[#1a1030] to-[#100820] py-24 lg:py-32 border-b border-[#2d1f45]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center">
            <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-[#7c3aed15] border border-[#7c3aed33] text-[#a78bfa] text-xs font-bold uppercase tracking-widest animate-dashFadeIn">
               AI-Mediated Protocol v2.0
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-tight">
              Trust in Every <span className="text-[#7c3aed] drop-shadow-[0_0_15px_#7c3aed66]">Gig</span>
            </h1>
            <p className="text-xl text-[#7b6a96] mb-12 max-w-2xl mx-auto leading-relaxed">
              The first freelance platform with <span className="text-[#e2d9f3] font-semibold">autonomous escrow</span> and 
              <span className="text-[#e2d9f3] font-semibold"> AI-structured verification</span>. 
              Eliminate disputes. Enforce specifications. Build trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="px-8 py-4 bg-[#7c3aed] text-white rounded-xl font-bold text-lg hover:bg-[#8b5cf6] hover:shadow-[0_0_20px_#7c3aed44] transition-all">
                Get Started Free
              </Link>
              <Link href="/login" className="px-8 py-4 bg-[#1d1233] text-[#e2d9f3] border border-[#2d1f45] rounded-xl font-bold text-lg hover:bg-[#251840] hover:border-[#7c3aed44] transition-all">
                Client Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#130d22]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-bold text-white mb-4">
              Decentralized Trust Protocol
            </h2>
            <p className="text-[#6b5a8a] text-sm uppercase tracking-[0.2em] font-bold">Why choose trustmebro?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="🎯" 
              title="AI-Powered Specs" 
              desc="Turn vague job descriptions into structured, verifiable specifications automatically." 
            />
            <FeatureCard 
              icon="🔍" 
              title="Automated Verification" 
              desc="AI evaluates submissions across multiple criteria objectively and fairly." 
            />
            <FeatureCard 
              icon="🤝" 
              title="AI-Mediated Chat" 
              desc="Real-time AI catches scope creep and clarifies specs during projects." 
            />
            <FeatureCard 
              icon="💰" 
              title="Secure Escrow" 
              desc="Funds held securely and released automatically based on verification scores." 
            />
            <FeatureCard 
              icon="🏆" 
              title="PFI Trust Scores" 
              desc="Transparent, data-backed trust metrics for both employers and freelancers." 
            />
            <FeatureCard 
              icon="⚡" 
              title="Verified Lanes" 
              desc="Specialized AI analysis for Software, Copywriting, Data Entry, and Translation." 
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#100820] border-y border-[#2d1f45]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white text-center mb-20">
            The Workflow
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <StepCard number="1" title="Post & Structure" desc="AI transforms your JD into a cryptographically signed spec with clear milestones." />
            <StepCard number="2" title="Smart Matching" desc="Review bids from freelancers with verified PFI scores and relevant proof-of-work." />
            <StepCard number="3" title="Shielded Work" desc="Work in AI-mediated channels that detect scope creep and enforce definitions." />
            <StepCard number="4" title="Instant Payout" desc="AI verifies the deliverables. Score ≥ 90% triggers autonomous escrow release." />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#7c3aed22] to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold mb-8 text-white leading-tight">
            Ready to <span className="text-[#a78bfa]">Build Trust</span> in the Gig Economy?
          </h2>
          <p className="text-xl mb-12 text-[#7b6a96] leading-relaxed">
            Join the next generation of freelancing where AI ensures fairness and certainty.
          </p>
          <Link href="/register" className="inline-block px-10 py-5 bg-[#7c3aed] text-white rounded-2xl font-bold text-xl hover:bg-[#8b5cf6] hover:shadow-[0_0_30px_#7c3aed66] transition-all">
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-[#1d1233] border border-[#2d1f45] hover:border-[#7c3aed44] transition-all group hover:shadow-[0_8px_30px_rgb(124,58,237,0.1)]">
      <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">{icon}</div>
      <h3 className="text-xl font-bold text-[#e2d9f3] mb-4 group-hover:text-white transition-colors">
        {title}
      </h3>
      <p className="text-[#7b6a96] text-sm leading-relaxed">
        {desc}
      </p>
    </div>
  );
}

function StepCard({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="text-center relative">
      <div className="w-16 h-16 bg-[#1d1233] border border-[#2d1f45] text-[#7c3aed] rounded-2xl flex items-center justify-center text-2xl font-black mx-auto mb-6 shadow-sm shadow-[#7c3aed22]">
        {number}
      </div>
      <h3 className="text-lg font-bold text-[#e2d9f3] mb-3">
        {title}
      </h3>
      <p className="text-sm text-[#6b5a8a] leading-relaxed">
        {desc}
      </p>
    </div>
  );
}
