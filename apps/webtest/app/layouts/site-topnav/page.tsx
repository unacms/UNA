// Site Top Nav Demo Page - Server Component with caching
import { cacheLife } from 'next/cache'

export default async function SiteTopNavPage() {
  'use cache'
  cacheLife('max')

  return (
    <>
      {/* Hero Section - Pure HTML */}
      <section className="py-20 px-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 mb-4 text-sm font-medium bg-primary/10 text-primary rounded-full">
            Welcome to NEO
          </span>
          <h1 className="text-5xl font-bold mb-6">
            Connect, Share, and Grow Together
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Join a community of creators, thinkers, and innovators. Share your ideas and discover what matters to you.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/signup"
              className="px-6 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Get Started
            </a>
            <a
              href="/learn"
              className="px-6 py-3 text-lg font-medium border border-border rounded-lg hover:bg-accent"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid - Static HTML */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose NEO</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard
              icon="👥"
              title="Communities"
              description="Join groups that match your interests"
            />
            <FeatureCard
              icon="💬"
              title="Conversations"
              description="Engage in meaningful discussions"
            />
            <FeatureCard
              icon="📅"
              title="Events"
              description="Discover and create local events"
            />
            <FeatureCard
              icon="🛡️"
              title="Privacy First"
              description="Your data stays yours"
            />
          </div>
        </div>
      </section>

      {/* Info banner */}
      <section className="py-8 px-6 bg-muted/50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            <strong>Server Component Demo:</strong> This entire page is rendered on the server.
            Zero client JavaScript for the static content. Check the Network tab - no hydration bundle!
          </p>
        </div>
      </section>
    </>
  )
}

// Pure function component - no hooks, no client JS
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-lg border border-border bg-card">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}


