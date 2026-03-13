import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-secondary to-background">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
              Trust in Every <span className="text-primary">Gig</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              AI-mediated freelance platform with escrow and automated verification.
              No more disputes. No more scope creep. Just trust.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register" className="btn-primary text-lg">
                Get Started Free
              </Link>
              <Link href="/login" className="btn-secondary text-lg">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground text-center mb-16">
            Why trustmebro?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                AI-Powered Specs
              </h3>
              <p className="text-muted-foreground">
                Turn vague job descriptions into structured, verifiable specifications automatically
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Automated Verification
              </h3>
              <p className="text-muted-foreground">
                AI evaluates submissions across multiple criteria objectively and fairly
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                AI-Mediated Chat
              </h3>
              <p className="text-muted-foreground">
                Real-time AI catches scope creep and clarifies specs during projects
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Secure Escrow
              </h3>
              <p className="text-muted-foreground">
                Funds held securely and released automatically based on verification
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                PFI Trust Scores
              </h3>
              <p className="text-muted-foreground">
                Transparent trust metrics for both employers and freelancers
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                4 Gig Types
              </h3>
              <p className="text-muted-foreground">
                Software, Copywriting, Data Entry, and Translation with 24 subtypes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground text-center mb-16">
            How It Works
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Post Job
              </h3>
              <p className="text-sm text-muted-foreground">
                Paste your job description. AI generates structured spec with milestones and criteria
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Find Freelancer
              </h3>
              <p className="text-sm text-muted-foreground">
                Review bids from qualified freelancers. Choose based on PFI and proposals
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Work & Chat
              </h3>
              <p className="text-sm text-muted-foreground">
                Freelancer works. AI-mediated chat handles questions and scope creep
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Verify & Pay
              </h3>
              <p className="text-sm text-muted-foreground">
                AI verifies work. Funds release automatically when score ≥ 90%
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Build Trust?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of employers and freelancers using trustmebro
          </p>
          <Link href="/register" className="btn bg-white text-primary hover:bg-gray-100 text-lg">
            Get Started Now
          </Link>
        </div>
      </section>
    </div>
  );
}
